import { Inbox } from '@novu/react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';

export default function NotificationInbox() {
    const { currentUser } = useAuth();

    return (
        <Inbox
            applicationIdentifier="ianP1FkoBqZG"
            subscriberId={currentUser?.uid ?? '69e909bfeb59b447fe065949'}
            socketUrl="wss://socket.novu.co"
            routerPush={(path: string) => navigate(path)}
            appearance={{
                variables: {
                    colorPrimary: '#10b981',
                    colorForeground: '#0f172a',
                },
            }}
        />
    );
}
