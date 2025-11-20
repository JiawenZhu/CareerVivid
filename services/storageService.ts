import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Converts a Data URL string to a Blob object.
 */
export const dataURLtoBlob = (dataurl: string): Blob | null => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

/**
 * Fallback function to upload image via Cloud Function (Server-side)
 * This bypasses CORS restrictions that might block the client-side SDK.
 */
const uploadImageViaFunction = async (file: Blob | Uint8Array | ArrayBuffer, path: string): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be authenticated for fallback upload.");
    
    const token = await user.getIdToken();
    
    // Helper to convert various input types to base64
    let base64: string;
    let mimeType: string = 'image/png';

    if (file instanceof Blob) {
        mimeType = file.type || 'image/png';
        base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    } else {
        // Uint8Array or ArrayBuffer
        const buffer = file instanceof Uint8Array ? file : new Uint8Array(file);
        let binary = '';
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        base64 = btoa(binary);
    }

    // Hardcoded project ID for Cloud Function URL
    const projectId = 'jastalk-firebase'; 
    const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/uploadImageHttp`;

    console.log(`[Upload Debug] Attempting server-side upload via: ${functionUrl}`);

    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            image: base64,
            path: path,
            mimeType: mimeType
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Upload Debug] Server-side upload failed response:', errorText);
        throw new Error(`Server-side upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('[Upload Debug] Server-side upload successful. URL:', data.downloadUrl);
    return data.downloadUrl;
};

/**
 * Uploads an image to Firebase Storage with verbose logging and conditional error handling.
 * 
 * @param file - The file to upload (Blob, Uint8Array, or ArrayBuffer)
 * @param path - The full storage path (e.g., 'users/123/resume_photos/img.png')
 * @returns Promise<string> - The download URL of the uploaded file
 */
export const uploadImage = async (file: Blob | Uint8Array | ArrayBuffer, path: string): Promise<string> => {
  console.log(`[Upload Debug] Starting upload...`);
  console.log(`[Upload Debug] Target Path: ${path}`);
  
  const currentUser = auth.currentUser;
  console.log(`[Upload Debug] Auth Status: ${currentUser ? `User ID: ${currentUser.uid}` : 'Unauthenticated'}`);

  if (!currentUser && path.includes('resume_photos')) {
      console.warn("[Upload Debug] WARNING: Uploading to a user-specific path (resume_photos) without an authenticated user.");
  }

  try {
    // Attempt 1: Standard Client-Side SDK Upload
    const storageRef = ref(storage, path);
    
    // Determine content type and size
    let contentType = 'image/png'; // Default fallback
    let size = 0;

    if (file instanceof Blob) {
        contentType = file.type;
        size = file.size;
    } else {
        size = file.byteLength;
    }
    
    const metadata = {
        contentType: contentType,
    };

    console.log('[Upload Debug] Uploading bytes (Client SDK)...', { size, metadata });
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('[Upload Debug] Upload successful. Snapshot:', snapshot);
    
    console.log('[Upload Debug] Fetching download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[Upload Debug] Download URL retrieved:', downloadURL);
    
    return downloadURL;

  } catch (error: any) {
    console.error('[Upload Debug] Client-side Upload FAILED:', error);
    
    // Detect CORS or Network Errors to trigger Fallback
    // 'storage/retry-limit-exceeded' often happens when CORS blocks the preflight or request
    // TypeError with 'fetch' or 'network' usually indicates CORS in many browsers
    // 'net::ERR_FAILED' is Chrome's generic network/CORS error
    const isCorsOrNetworkError = 
        error.code === 'storage/retry-limit-exceeded' || 
        error.code === 'storage/canceled' || 
        error.message?.includes('network') || 
        error.message?.includes('fetch');

    if (isCorsOrNetworkError) {
        console.warn('[Upload Debug] Detected network/CORS issue. Switching to Server-Side Fallback...');
        try {
            return await uploadImageViaFunction(file, path);
        } catch (fallbackError: any) {
            console.error('[Upload Debug] Server-Side Fallback ALSO FAILED:', fallbackError);
            // Log the fallback failure to Firestore if possible
             if (path.includes('resume_photos')) {
                 try {
                     await addDoc(collection(db, 'system_alerts'), {
                        error_message: `Fallback Failed: ${fallbackError.message}`,
                        original_error: error.message,
                        user_id: currentUser?.uid || 'anonymous',
                        path: path,
                        timestamp: serverTimestamp(),
                        type: 'upload_fallback_failure'
                    });
                 } catch (e) { /* ignore log error */ }
             }
             throw fallbackError; // Throw the fallback error
        }
    }

    // Conditional Error Handling for non-fallback errors
    if (path.includes('resume_photos')) {
        console.log('[Upload Debug] Path contains "resume_photos". Logging to system_alerts...');
        try {
             await addDoc(collection(db, 'system_alerts'), {
                error_message: error.message || 'Unknown upload error',
                user_id: currentUser?.uid || 'anonymous',
                path: path,
                timestamp: serverTimestamp(),
                type: 'resume_upload_failure',
                raw_error: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
            console.log('[Upload Debug] Error successfully logged to Firestore.');
        } catch (logError) {
            console.error('[Upload Debug] Failed to log error to Firestore:', logError);
        }
    } else if (path.includes('blog_assets')) {
        console.error('[Upload Debug] Blog Asset Upload Error (Admin Console):', error);
    }

    // Rethrow the error so the UI component can set loading to false
    throw error; 
  }
};