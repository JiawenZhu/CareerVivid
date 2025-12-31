import { useCallback, useRef, useState } from 'react';

type LongPressEvent = React.MouseEvent | React.TouchEvent;

interface Options {
    shouldPreventDefault?: boolean;
    delay?: number;
}

const useLongPress = (
    onLongPress: (event: LongPressEvent) => void,
    onClick?: (event: LongPressEvent) => void,
    { shouldPreventDefault = true, delay = 300 }: Options = {}
) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef<NodeJS.Timeout>();
    const target = useRef<EventTarget>();

    const start = useCallback(
        (event: LongPressEvent) => {
            if (shouldPreventDefault && event.target) {
                event.target.addEventListener('touchend', preventDefault, {
                    passive: false,
                });
                target.current = event.target;
            }
            timeout.current = setTimeout(() => {
                onLongPress(event);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = useCallback(
        (event: LongPressEvent, shouldTriggerClick = true) => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
            if (shouldPreventDefault && target.current) {
                target.current.removeEventListener('touchend', preventDefault);
            }
            if (shouldTriggerClick && !longPressTriggered && onClick) {
                onClick(event);
            }
            setLongPressTriggered(false);
        },
        [shouldPreventDefault, onClick, longPressTriggered]
    );

    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchEnd: (e: React.TouchEvent) => clear(e),
    };
};

const preventDefault = (e: Event) => {
    if (!('touches' in e)) return;
    if (e instanceof TouchEvent && e.touches.length < 2 && e.preventDefault) {
        e.preventDefault();
    }
};

export default useLongPress;
