import "./types/types";
import { DrawingAction } from "./types/types";

/**
 * @typedef{import('./types/types').Point} Point
 * @typedef{import('./types/types').Points} Points
 * @typedef{import('./types/types').Stroke} Stroke
 * @typedef{import('./types/types').Drawing} Drawing
 * @typedef{import('./types/types').Collection} Collection
 */

(function () {
	class DrawingApp {
		/**@type{boolean}*/
		#isDrawing;

		/**@type{string | null}*/
		#strokeWeight;

		/**@type{string | null}*/
		#strokeColor;

		/**@type{string | null}*/
		#drawingMode;

		/**@type{string | null}*/
		#screenRatio;

		/**@param{string} canvasId*/
		constructor(canvasId) {
			this.canvas = /**@type{HTMLCanvasElement | null}*/ (
				document.getElementById(canvasId)
			);
			if (this.canvas === null) {
				throw new ReferenceError(
					`Could not find element with the id:  ${canvasId}`,
				);
			}

			this.ctx = this.canvas.getContext("2d");

			this.#isDrawing = false;

			this.#strokeWeight = localStorage.getItem("currentStrokeWeight");
			if (this.#strokeWeight === null) {
				this.#strokeWeight = "1";
				try {
					localStorage.setItem("currentStrokeWeight", this.#strokeWeight);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save default drawing stroke weight an error occurred in the process",
					);
				}
			}

			this.#strokeColor = localStorage.getItem("currentStrokeColor");
			if (this.#strokeColor === null) {
				this.#strokeColor = "black";
				try {
					localStorage.setItem("currentStrokeColor", this.#strokeColor);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save default drawing stroke color an error occurred in the process",
					);
				}
			}

			this.#drawingMode = localStorage.getItem("currentDrawingMode");
			if (this.#drawingMode === null) {
				this.#drawingMode = DrawingAction.DRAW;
				try {
					localStorage.setItem("currentDrawingMode", this.#drawingMode);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save default drawing mode an error occurred in the process",
					);
				}
			}

			this.#screenRatio = localStorage.getItem("currentScreenRatio");
			if (this.#screenRatio === null) {
				this.#screenRatio = window.devicePixelRatio.toString();
				try {
					localStorage.setItem("currentScreenRatio", this.#screenRatio);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save current screen ratio an error occurred in the process",
					);
				}
			}

			this.canvas.addEventListener(
				"pointerdown",
				this.#startDrawing.bind(this),
			);
			this.canvas.addEventListener("pointerup", this.#stopDrawing.bind(this));
			this.canvas.addEventListener(
				"pointercancel",
				this.#stopDrawing.bind(this),
			);
			this.canvas.addEventListener("pointermove", this.#draw.bind(this));
			window.addEventListener("resize", this.#resizeCanvas.bind(this));

			this.#resizeCanvas();
		}

		#startDrawing() {
			this.#isDrawing = true;
		}

		#stopDrawing() {}

		#draw() {}

		#resizeCanvas() {}
	}
})();
