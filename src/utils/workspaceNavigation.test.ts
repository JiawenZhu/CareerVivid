import { getPathForNodeId } from './workspaceNavigation';

describe('workspaceNavigation - getPathForNodeId', () => {
    it('should return the ID directly if it is already an absolute path', () => {
        expect(getPathForNodeId('/dashboard')).toBe('/dashboard');
        expect(getPathForNodeId('/profile')).toBe('/profile');
    });

    it('should map resume composite IDs to their edit paths', () => {
        expect(getPathForNodeId('resume-12345')).toBe('/edit/12345');
    });

    it('should map portfolio composite IDs to their view paths', () => {
        expect(getPathForNodeId('portfolio-abc')).toBe('/portfolio/abc');
    });

    it('should map whiteboard composite IDs to their whiteboard view paths', () => {
        expect(getPathForNodeId('whiteboard-xyz')).toBe('/whiteboard/xyz');
    });

    it('should map post composite IDs to their community post paths', () => {
        expect(getPathForNodeId('post-postid')).toBe('/community/post/postid');
    });

    it('should map interview composite IDs to their InterviewStudio paths', () => {
        expect(getPathForNodeId('interview-98765')).toBe('/interview-studio/98765');
    });

    it('should map custom folders to their folder views', () => {
        expect(getPathForNodeId('my-custom-folder', 'custom-folder')).toBe('/folder/my-custom-folder');
    });

    it('should fall back to returning the original ID string otherwise', () => {
        expect(getPathForNodeId('unknown-id')).toBe('unknown-id');
        expect(getPathForNodeId(12345)).toBe('12345');
    });
});
