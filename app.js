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
		#screenRatio;

		/**
		 * @param{HTMLCanvasElement} canvas
		 * @param{CanvasRenderingContext2D} ctx
		 */
		constructor(canvas, ctx) {
			if (!canvas || !ctx)
				throw new ReferenceError(
					"Invalid paramater of class, could not instantiate",
				);
			this.canvas = canvas;
			this.ctx = ctx;

			this.#isDrawing = false;

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

	class DrawingSettingContols {
		/**@type{string | null}*/
		#strokeWeight;

		/**@type{string | null}*/
		#strokeColor;

		/**@type{string | null}*/
		#drawingMode;

		/**
		 * All params are assumed to be null checked
		 * before being pass into the class
		 *
		 * @param{HTMLCanvasElement} canvas
		 * @param{CanvasRenderingContext2D} ctx
		 * @param{HTMLDivElement} toolBar
		 */
		constructor(canvas, ctx, toolBar) {
			if (!canvas || !ctx || !toolBar)
				throw new ReferenceError(
					"Invalid paramater of class, could not instantiate",
				);
			this.canvas = canvas;
			this.ctx = ctx;
			this.toolBar = toolBar;

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

			toolBar.addEventListener(
				"change",
				this.#handleChangeEventOnToolBar.bind(this),
			);
			toolBar.addEventListener(
				"click",
				this.#handleClickEventOnToolBar.bind(this),
			);
		}

		#handleChangeEventOnToolBar() {}
		#handleClickEventOnToolBar() {}
	}
})();
