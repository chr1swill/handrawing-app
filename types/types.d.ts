export type Point = {
	x: number;
	y: number;
};

export type Points = Point[];

export const enum DrawingAction {
	DRAW = 0,
	ERASE = 1,
}

export type Stroke = {
	points: Points;
	action: DrawingAction;
};

export type Drawing = {
	name: string;
	strokes: Stroke[];
};

export type Collection = {
	name: string;
	[key: Drawing.name]: Drawing;
};
