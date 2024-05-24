export type Point = {
	x: number;
	y: number;
};

export type Points = Point[];

enum DrawingActions {
	DRAW = "0",
	ERASE = "1",
}

export type DrawingAction = "0" | "1";

export type Stroke = {
	points: Points;
	drawingMode: DrawingAction;
	weight: number;
	color: string;
};

export type Drawing = {
	name: string;
	strokes: Stroke[];
};

export type Collection = {
	collectionName: string;
	[key: string]: Drawing;
};
