import React, { useRef, useLayoutEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useTexture, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { CARD_TEMPLATES } from '../../features/portfolio/constants/cardTemplates';
import { PortfolioData } from '../../features/portfolio/types/portfolio';

interface NFCCard3DProps {
    data?: PortfolioData;
    templateId?: string;
    isVertical?: boolean;
    isFlipped?: boolean;
    onToggleFlip?: () => void;
}

export const NFCCard3D: React.FC<NFCCard3DProps> = ({
    data,
    templateId,
    isVertical = true,
    isFlipped = false,
    onToggleFlip
}) => {
    const meshRef = useRef<THREE.Group>(null);
    const cardRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState<string | null>(null);

    // Determine configuration
    const activeId = templateId || data?.templateId || 'brutalist_yellow';
    // Fallback to brutalist_yellow if template not found
    const config = CARD_TEMPLATES[activeId] || CARD_TEMPLATES['brutalist_yellow'];

    // Theme Colors
    const themeColor = config.baseColor || '#FFB800';
    const textColor = '#FFFFFF'; // Front text is always white per Neo-Brutalism spec
    const backTextColor = '#000000'; // Back text is black

    // Load textures
    const avatarUrl = data?.hero?.avatarUrl ||
        'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fimage_assets%2F1766886837900_edited.png?alt=media';
    const avatarTexture = useTexture(avatarUrl);
    avatarTexture.colorSpace = THREE.SRGBColorSpace;

    // QR Code Texture (Static for demo)
    const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://careervivid.app/u/evasportfoliocard';
    const qrTexture = useTexture(qrCodeUrl);

    // Dynamic Gradient Texture
    const gradientTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 0, 512);
            // Matches: Transparent top -> Theme Color bottom
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.4, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.6, themeColor + '66'); // 40% opacity hex
            gradient.addColorStop(0.8, themeColor + 'CC'); // 80% opacity hex
            gradient.addColorStop(1, themeColor);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }, [themeColor]);

    // Scroll animations
    useLayoutEffect(() => {
        if (!meshRef.current) return;
        meshRef.current.rotation.set(0, 0, 0);
        meshRef.current.position.set(0, 0, 0);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "#nfc-hero-section",
                start: "top top",
                end: "bottom top",
                scrub: 1,
            }
        });
        tl.to(meshRef.current.rotation, { x: 0.15, y: 0.3, z: 0.02, duration: 1 });

        const tl2 = gsap.timeline({
            scrollTrigger: {
                trigger: "#nfc-features-section",
                start: "top center",
                end: "bottom center",
                scrub: 1
            }
        });
        tl2.to(meshRef.current.rotation, { x: 0, y: Math.PI * 2, z: 0, duration: 2 });

        return () => {
            tl.kill();
            tl2.kill();
        };
    }, []);

    // Floating animation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
        }

        // Smooth flip animation
        if (cardRef.current) {
            const targetRotation = isFlipped ? Math.PI : 0;
            cardRef.current.rotation.y = THREE.MathUtils.lerp(cardRef.current.rotation.y, targetRotation, 0.1);
        }
    });

    // Card dimensions (Vertical Credit Card Ratio)
    const cardWidth = 2.5;
    const cardHeight = 4.2;
    const cardDepth = 0.06;
    const borderRadius = 0.24;

    // Sample data
    const headline = data?.hero?.headline || "Eva's portfolio\ncard";
    const about = data?.about || "SARAH IS A SEASONED UX DESIGNER WITH OVER 8 YEARS OF EXPERIENCE...";
    const phone = data?.phone || "408-123-4567";
    const email = data?.contactEmail || "sarah.chen.ux@example.com";
    const portfolioUrl = "careervivid.app/evasportfoliocard"; // Updated to match image shorter url style if needed

    // Handlers
    const handleIconClick = (e: any) => {
        e.stopPropagation();
        if (onToggleFlip) onToggleFlip();
    };

    return (
        <group ref={meshRef}>
            <group ref={cardRef}>
                {/* ==================== FRONT FACE ==================== */}
                <group visible={!isFlipped || cardRef.current?.rotation.y < Math.PI / 2}>
                    {/* Card Base Container (Black Border) */}
                    <RoundedBox args={[cardWidth + 0.08, cardHeight + 0.08, cardDepth]} radius={borderRadius} smoothness={4} position={[0, 0, -0.01]}>
                        <meshBasicMaterial color="#000000" />
                    </RoundedBox>

                    {/* Main Card Body */}
                    <RoundedBox args={[cardWidth, cardHeight, cardDepth]} radius={borderRadius - 0.02} smoothness={4}>
                        <meshBasicMaterial color="#1a1a1a" />
                    </RoundedBox>

                    {/* Avatar Texture Layer */}
                    <mesh position={[0, 0, cardDepth / 2 + 0.001]}>
                        <planeGeometry args={[cardWidth, cardHeight]} />
                        <meshBasicMaterial map={avatarTexture} toneMapped={false} />
                    </mesh>

                    {/* Gradient Overlay Layer */}
                    <mesh position={[0, 0, cardDepth / 2 + 0.002]}>
                        <planeGeometry args={[cardWidth, cardHeight]} />
                        <meshBasicMaterial map={gradientTexture} transparent opacity={1} toneMapped={false} />
                    </mesh>

                    {/* --- Content Layer (Front) --- */}
                    <group position={[0, 0, cardDepth / 2 + 0.003]}>

                        {/* QR Icon Button (Top Right) */}
                        <group position={[cardWidth / 2 - 0.45, cardHeight / 2 - 0.45, 0]} onClick={handleIconClick}
                            onPointerOver={() => setHovered('front-icon')} onPointerOut={() => setHovered(null)}>
                            {/* White Box for Icon */}
                            <mesh position={[0, 0, 0]}>
                                <planeGeometry args={[0.5, 0.5]} />
                                <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
                            </mesh>
                            {/* Black Border for Icon */}
                            <mesh position={[0, 0, -0.001]}>
                                <planeGeometry args={[0.56, 0.56]} />
                                <meshBasicMaterial color="#000000" toneMapped={false} />
                            </mesh>
                            {/* Icon Symbol */}
                            <Text position={[0, 0, 0.01]} fontSize={0.25} color="#000000" anchorX="center" anchorY="middle">
                                ⊞
                            </Text>
                        </group>

                        {/* Text Content (Bottom aligned) */}
                        <group position={[-cardWidth / 2 + 0.2, -cardHeight / 2 + 0.2, 0]}>
                            {/* Headline */}
                            <Text
                                position={[0, 1.8, 0]}
                                fontSize={0.35}
                                color={textColor}
                                anchorX="left"
                                anchorY="bottom"
                                maxWidth={cardWidth * 0.9}
                                lineHeight={1.1}
                                fontWeight="bold"
                            >
                                {headline}
                            </Text>

                            {/* Bio */}
                            <Text
                                position={[0, 1.1, 0]}
                                fontSize={0.11}
                                color={textColor}
                                anchorX="left"
                                anchorY="top" // Anchor top so it flows down
                                maxWidth={cardWidth * 0.85}
                                lineHeight={1.4}
                            >
                                {about.toUpperCase().slice(0, 120)}
                            </Text>

                            {/* Contact Info */}
                            <group position={[0, 0.4, 0]}>
                                <Text position={[0, 0, 0]} fontSize={0.12} color={textColor} anchorX="left">
                                    📞 {phone}
                                </Text>
                                <Text position={[0, -0.25, 0]} fontSize={0.12} color={textColor} anchorX="left">
                                    ✉️ {email}
                                </Text>
                            </group>
                        </group>
                    </group>
                </group>

                {/* ==================== BACK FACE ==================== */}
                <group rotation-y={Math.PI} visible={isFlipped || cardRef.current?.rotation.y > Math.PI / 2}>
                    {/* Card Base Container (Black Border) */}
                    <RoundedBox args={[cardWidth + 0.08, cardHeight + 0.08, cardDepth]} radius={borderRadius} smoothness={4} position={[0, 0, -0.01]}>
                        <meshBasicMaterial color="#000000" />
                    </RoundedBox>

                    {/* Main Card Body (Solid Theme Color) */}
                    <RoundedBox args={[cardWidth, cardHeight, cardDepth]} radius={borderRadius - 0.02} smoothness={4}>
                        <meshBasicMaterial color={themeColor} toneMapped={false} />
                    </RoundedBox>

                    {/* --- Content Layer (Back) --- */}
                    <group position={[0, 0, cardDepth / 2 + 0.003]}>

                        {/* Flip Icon Button (Top Right) */}
                        <group position={[cardWidth / 2 - 0.45, cardHeight / 2 - 0.45, 0]} onClick={handleIconClick}
                            onPointerOver={() => setHovered('back-icon')} onPointerOut={() => setHovered(null)}>
                            {/* White Box */}
                            <mesh position={[0, 0, 0]}>
                                <planeGeometry args={[0.5, 0.5]} />
                                <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
                            </mesh>
                            {/* Black Border */}
                            <mesh position={[0, 0, -0.001]}>
                                <planeGeometry args={[0.56, 0.56]} />
                                <meshBasicMaterial color="#000000" toneMapped={false} />
                            </mesh>
                            {/* Icon Symbol */}
                            <Text position={[0, 0, 0.01]} fontSize={0.25} color="#000000" anchorX="center" anchorY="middle">
                                ↺
                            </Text>
                        </group>

                        {/* Large White Square for QR Code */}
                        <group position={[0, 0.3, 0]}>
                            <RoundedBox args={[1.8, 1.8, 0.01]} radius={0.1}>
                                <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
                            </RoundedBox>

                            {/* QR Texture */}
                            <mesh position={[0, 0, 0.01]}>
                                <planeGeometry args={[1.5, 1.5]} />
                                <meshBasicMaterial map={qrTexture} toneMapped={false} />
                            </mesh>
                        </group>

                        {/* "SCAN TO CONNECT" Text */}
                        <Text
                            position={[0, -0.9, 0]}
                            fontSize={0.16}
                            color={backTextColor}
                            anchorX="center"
                            anchorY="middle"
                            fontWeight="bold"
                            letterSpacing={0.05}
                        >
                            SCAN TO CONNECT
                        </Text>

                        {/* URL Text */}
                        <Text
                            position={[0, -1.2, 0]}
                            fontSize={0.1}
                            color={backTextColor} // Or white/lighter if needed contrast
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={cardWidth * 0.9}
                            textAlign="center"
                        >
                            https://{portfolioUrl}
                        </Text>
                    </group>
                </group>
            </group>

            {/* Cursor effect */}
            <Html>
                <div style={{ cursor: hovered ? 'pointer' : 'auto' }} />
            </Html>
        </group>
    );
};
