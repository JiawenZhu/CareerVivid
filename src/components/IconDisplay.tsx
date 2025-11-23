
import React from 'react';
import { 
    Mail, Phone, MapPin, Globe, Linkedin, Github, Facebook, Twitter, 
    Instagram, Youtube, Video, AtSign, Briefcase, Link as LinkIcon, Send 
} from 'lucide-react';

interface IconDisplayProps {
    iconName: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

const IconDisplay: React.FC<IconDisplayProps> = ({ iconName, size = 16, className, style }) => {
    const iconProps = { size, className, style };

    switch (iconName?.toLowerCase()) {
        case 'mail': return <Mail {...iconProps} />;
        case 'phone': return <Phone {...iconProps} />;
        case 'map-pin': return <MapPin {...iconProps} />;
        case 'globe': return <Globe {...iconProps} />;
        case 'linkedin': return <Linkedin {...iconProps} />;
        case 'github': return <Github {...iconProps} />;
        case 'facebook': return <Facebook {...iconProps} />;
        case 'twitter': return <Twitter {...iconProps} />;
        case 'instagram': return <Instagram {...iconProps} />;
        case 'youtube': return <Youtube {...iconProps} />;
        case 'video': return <Video {...iconProps} />; // TikTok generic
        case 'at-sign': return <AtSign {...iconProps} />;
        case 'briefcase': return <Briefcase {...iconProps} />;
        case 'send': return <Send {...iconProps} />;
        case 'link':
        default: return <LinkIcon {...iconProps} />;
    }
};

export default IconDisplay;
