import { useState } from 'react';

export const FacingDirections = {
    LEFT: 'left',
    RIGHT: 'right',
} as const;

export type FacingDirection = typeof FacingDirections[keyof typeof FacingDirections];

export interface ItemProps {
    isSelected: boolean,
    currentTilt: number,
    direction: FacingDirection
}

interface SlantedDisplayProps<T> {
    items: T[];
    renderItem: (
        item: T,
        props: ItemProps,
    ) => React.ReactNode;
    tilt?: number;
    gap?: number;
    // Controlled mode
    activeIndex?: number;
    onActiveIndexChange?: (index: number) => void;
    // Uncontrolled mode
    defaultActiveIndex?: number;
    tiltTowards: FacingDirection;
}

const SlantedDisplay = <T, >(
    {
        items = [],
        renderItem,
        activeIndex: controlledIndex,
        onActiveIndexChange,
        defaultActiveIndex = 0,
        gap = 0,
        tilt = 20,
        tiltTowards = FacingDirections.LEFT,
    }: SlantedDisplayProps<T>) => {
    const [internalIndex, setInternalIndex] = useState(defaultActiveIndex);

    const isControlled = controlledIndex !== undefined;
    const activeIndex = isControlled ? controlledIndex : internalIndex;

    const handleClick = (index: number) => {
        if (!isControlled) {
            setInternalIndex(index);
        }
        onActiveIndexChange?.(index);
    };

    let clipPath;
    if (tilt == 0) {
        clipPath = undefined;
    } else {
        if (tiltTowards === FacingDirections.LEFT) {
            clipPath = `polygon(0% 0%, calc(100% - ${tilt}px) 0%, 100% 100%, ${tilt}px 100%)`;
        } else {
            clipPath = `polygon(${tilt}px 0%, 100% 0%, calc(100% - ${tilt}px) 100%, 0% 100%)`;
        }
    }

    return (
        <div className="relative flex items-stretch w-full overflow-hidden h-full"
             style={{ paddingLeft: `${tilt / 2.0}px`, paddingRight: `${tilt / 2.0}px` }}
        >
            {items?.map((item, index) => (
                <div
                    key={index}
                    style={{
                        marginRight: `-${(tilt - gap) / 2 + 0.5}px`,
                        marginLeft: `-${(tilt - gap) / 2 + 0.5}px`,
                        flex: (index === activeIndex ? 3 : 2),
                        clipPath: clipPath,
                    }}
                    className="flex items-center justify-center cursor-pointer transition-all ease-in-out duration-300 overflow-hidden "
                    onClick={() => handleClick(index)}
                >
                    {renderItem(item, {
                        isSelected: index === activeIndex,
                        currentTilt: tilt,
                        direction: tiltTowards,
                    })}
                </div>
            ))}
        </div>
    );
};

export default SlantedDisplay;