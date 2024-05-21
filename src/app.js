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
		/**@type{number}*/
		#strokeWeight;

		/**@type{string}*/
		#strokeColor;

		/**@type{DrawingAction}*/
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

		/**@type{Drawing}*/
		#drawing = { name: "", strokes: [] };

		/**
		 * All params are assumed to be null checked
		 * before being pass into the class
		 *
		 * @param{HTMLCanvasElement} canvas
		 * @param{CanvasRenderingContext2D} ctx
		 * @param{HTMLDivElement} toolBar
		 * @param{string} name
		 */
		constructor(canvas, ctx, toolBar, name) {
			if (!canvas || !ctx || !toolBar) {
				throw new ReferenceError(
					"Invalid paramater of class, could not instantiate",
				);
			}

			this.canvas = canvas;
			this.ctx = ctx;
			this.toolBar = toolBar;
			this.#drawing.name = name;

			this.#isDrawing = false;

			/**@type{string | number | null}*/
			let storedStrokeWeight = localStorage.getItem(
				localStorageKeys.strokeWeight,
			);
			if (storedStrokeWeight === null) {
				storedStrokeWeight = 1;
				try {
					localStorage.setItem(
						localStorageKeys.strokeWeight,
						JSON.stringify(storedStrokeWeight),
					);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save default drawing stroke weight an error occurred in the process",
					);
				}

				this.#strokeWeight = storedStrokeWeight;
			} else {
				this.#strokeWeight = parseInt(storedStrokeWeight);
			}

			/**@type{string | null}*/
			let storedStrokeColor = localStorage.getItem(
				localStorageKeys.strokeColor,
			);
			if (storedStrokeColor === null) {
				storedStrokeColor = "black";
				try {
					localStorage.setItem(localStorageKeys.strokeColor, storedStrokeColor);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save default drawing stroke color an error occurred in the process",
					);
				}

				this.#strokeColor = storedStrokeColor;
			} else {
				this.#strokeColor = storedStrokeColor;
			}

			let storedDrawingMode = localStorage.getItem(
				localStorageKeys.drawingMode,
			);
			if (storedDrawingMode === null) {
				storedDrawingMode = DrawingAction.DRAW;
				try {
					localStorage.setItem(localStorageKeys.drawingMode, storedDrawingMode);
				} catch (e) {
					console.error(e);
					throw new Error(
						"Could not save default drawing mode an error occurred in the process",
					);
				}

				this.#drawingMode = /**@type{DrawingAction}*/ (storedDrawingMode);
			} else {
				this.#drawingMode = /**@type{DrawingAction}*/ (storedDrawingMode);
			}

			this.#stroke = {
				points: [],
				drawingMode: /**@type{DrawingAction}*/ (this.#drawingMode),
				weight: this.#strokeWeight,
				color: this.#strokeColor,
			};

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

			this.ctx.lineWidth = this.#strokeWeight;
			this.ctx.strokeStyle = this.#strokeColor;
			this.ctx.lineCap = "round";

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
				points: this.#points,
				drawingMode: this.#drawingMode,
				weight: this.#strokeWeight,
				color: this.#strokeColor,
			};

			this.#drawing.strokes.push(this.#stroke);
			try {
				localStorage.setItem(this.#drawing.name, JSON.stringify(this.#drawing));
			} catch (e) {
				console.error(e);
				console.warn(
					"Your drawing are no longer being save to local storage you have ran out of space, you will need to export your canvas to save",
				);
				// possibly add some sort of popup on screen that will save something similar
				// could use an alert need to that would get really annoying
			} finally {
				while (this.#points.length > 0) {
					this.#points.pop();
				}

				while (this.#stroke.points.length > 0) {
					this.#stroke.points.pop();
				}
			}
		}

		/**@param{PointerEvent} event*/
		#draw(event) {
			if (!this.#isDrawing) return;
			this.ctx.beginPath();
			this.ctx.moveTo(this.#position.x, this.#position.y);
			this.#getPostions(event);
			this.ctx.lineTo(this.#position.x, this.#position.y);
			this.ctx.stroke();
		}

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

	function main() {
		const canvas = /**@type{HTMLCanvasElement | null}*/ (
			document.getElementById("myCanvas")
		);
		if (canvas === null) {
			console.error("Could not find element with id: #myCanvas");
			return;
		}

		const ctx = canvas.getContext("2d");
		if (ctx === null) {
			console.error("Invalid context was provided, could the create context");
			return;
		}

		const toolBar = /**@type{HTMLDivElement | null}*/ (
			document.querySelector("[data-tool-bar]")
		);
		if (toolBar === null) {
			console.error(
				"Could not find element with the data attribute: [data-tool-bar]",
			);
			return;
		}

		const defaultCavasName = "DEFAULT_CANVAS";

		const drawingApp = new DrawingApp(canvas, ctx, toolBar, defaultCavasName);
		drawingApp;
	}
	main();
})();