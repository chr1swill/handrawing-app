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
	const localStorageKeys = Object.freeze({
		screenRatio: "currentScreenRatio",
		strokeWeight: "currentStrokeWeight",
		strokeColor: "currentStrokeColor",
		drawingMode: "currentDrawingMode",
		canvasRect: "currentCanvasRect",
	});

	class DrawingApp {
		/**@type{string | null}*/
		#strokeWeight;

		/**@type{string | null}*/
		#strokeColor;

		/**@type{string | null}*/
		#drawingMode;

		/**@type{boolean}*/
		#isDrawing;

		/**@type{number}*/
		#screenRatio;

		/**@type{DOMRect}*/
		#canvasRect;

		/**@type{Point}*/
		#position = { x: 0, y: 0 };

		/**@type{Points}*/
		#points = [];

        /**@type{Stroke}*/
        #stroke;

		/**
		 * All params are assumed to be null checked
		 * before being pass into the class
		 *
		 * @param{HTMLCanvasElement} canvas
		 * @param{CanvasRenderingContext2D} ctx
		 * @param{HTMLDivElement} toolBar
		 */
		constructor(canvas, ctx, toolBar) {
			if (!canvas || !ctx || !toolBar) {
				throw new ReferenceError(
					"Invalid paramater of class, could not instantiate",
				);
            }

			this.canvas = canvas;
			this.ctx = ctx;
			this.toolBar = toolBar;

			this.#isDrawing = false;

            let storedDrawingMode = localStorage.getItem(localStorageKeys.drawingMode);
            if (storedDrawingMode === null) {

            }
            let storedStrokeWeight = localStorage.getItem(localStorageKeys.strokeWeight);
            let storedColor = localStorage.getItem(localStorageKeys.strokeColor);

            /**@type{Stroke}*/
            this.#stroke = { points: [], drawingMode: "", weight: 0, color: ""};

			const screenRatioAsString = localStorage.getItem(
				localStorageKeys.screenRatio,
			);
			if (screenRatioAsString === null) {
				this.#screenRatio = window.devicePixelRatio;
				try {
					localStorage.setItem(
						localStorageKeys.screenRatio,
						JSON.stringify(this.#screenRatio),
					);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save current screen ratio an error occurred in the process",
					);
				}
			} else {
				this.#screenRatio = parseFloat(screenRatioAsString);
			}

			this.#canvasRect = canvas.getBoundingClientRect();
			try {
				localStorage.setItem(
					localStorageKeys.canvasRect,
					JSON.stringify(this.#canvasRect),
				);
			} catch (e) {
				console.error(e);
				throw new Error(
					"Could not save current canvas DOMRect an error occurred in the process",
				);
			}

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

			this.toolBar.addEventListener(
				"change",
				this.#handleChangeEventOnToolBar.bind(this),
			);
			this.toolBar.addEventListener(
				"click",
				this.#handleClickEventOnToolBar.bind(this),
			);

			window.addEventListener("resize", this.#resizeCanvas.bind(this));

			this.#resizeCanvas();
		}

		/**
		 * @param{PointerEvent} event
		 */
		#getPostions(event) {
			this.#position.x =
				(((event.clientX - this.#canvasRect.left) / this.#canvasRect.width) *
					this.canvas.width) /
				this.#screenRatio;

			this.#position.y =
				(((event.clientY - this.#canvasRect.top) / this.#canvasRect.height) *
					this.canvas.height) /
				this.#screenRatio;

			this.#points.push(this.#position);
		}

		/**
		 * @param{PointerEvent} event
		 */
		#startDrawing(event) {
			this.#isDrawing = true;
			this.#getPostions(event);
		}

		#stopDrawing() {
			this.#isDrawing = false;
            this.#stroke = {

            while (this.#points.length > 0) {
                this.#points.pop();
            }
		}

		#draw() {}

		#resizeCanvas() {
			if (this.ctx === null) {
				throw new ReferenceError(
					"Could not access context, attempt returned null value",
				);
			}

			this.#screenRatio = window.devicePixelRatio;

			try {
				localStorage.setItem(
					localStorageKeys.screenRatio,
					JSON.stringify(this.#screenRatio),
				);
			} catch (e) {
				console.error(e);
				throw new Error(
					`An error occured when attempting to update the value of localStorage key: ${localStorageKeys.screenRatio}`,
				);
			}

			this.#canvasRect = this.canvas.getBoundingClientRect();
			try {
				localStorage.setItem(
					localStorageKeys.canvasRect,
					JSON.stringify(this.#canvasRect),
				);
			} catch (e) {
				console.error(e);
				throw new Error(
					`An error occured when attempting to update the value of localStorage key: ${localStorageKeys.canvasRect}`,
				);
			}

			const width = window.innerWidth * this.#screenRatio;
			const height = window.innerHeight * this.#screenRatio;
			this.ctx.canvas.style.width = window.innerWidth + "px";
			this.ctx.canvas.style.height = window.innerHeight + "px";
			this.ctx.canvas.width = width;
			this.ctx.canvas.height = height;
			this.ctx.scale(this.#screenRatio, this.#screenRatio); // Adjust drawing scale to account for the increased canvas size
		}


		#handleChangeEventOnToolBar() {}
		#handleClickEventOnToolBar() {}
	}
})();
