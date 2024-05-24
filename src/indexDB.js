//@ts-ignore
/**
 * @typedef{import('../types/types').Point} PointT
 * @typedef{import('../types/types').Points} PointsT
 * @typedef{import('../types/types').Stroke} StrokeT
 * @typedef{import('../types/types').Drawing} DrawingT
 * @typedef{import('../types/types').Collection} CollectionT
 * @typedef{import('../types/types').DrawingAction} DrawingActionT
 */

(function () {
	const DrawingAction = Object.freeze({
		DRAW: "0",
		ERASE: "1",
	});

	const IDBKeys = Object.freeze({
		screenRatio: "currentScreenRatio",
		strokeWeight: "currentStrokeWeight",
		strokeColor: "currentStrokeColor",
		drawingMode: "currentDrawingMode",
		canvasRect: "currentCanvasRect",
		currentDrawing: "currentDrawing",
	});

	class DrawingApp {
		/**@type{number}*/
		#strokeWeight = 5;

		/**@type{string}*/
		#strokeColor = "black";

		/**@type{DrawingActionT}*/
		#drawingMode = DrawingAction.DRAW;

		/**@type{boolean}*/
		#isDrawing = false;

		/**@type{number}*/
		#screenRatio = 1;

		/**@type{DOMRect}*/
		#canvasRect = new DOMRect(0, 0, 0, 0);

		/**@type{string}*/
		#currentDrawing = "";

		/**@type{PointT}*/
		#position = { x: 0, y: 0 };

		/**@type{PointsT}*/
		#points = [];

		/**@type{DrawingT}*/
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
					"Invalid parameter of class, could not instantiate",
				);
			}

			this.canvas = canvas;
			this.ctx = ctx;
			this.toolBar = toolBar;
			this.#drawing.name = name;
			this.#currentDrawing = name;

			this.#openIndexedDB()
				.then(async (db) => {
					const tx = db.transaction("settings", "readwrite");
					/**@type{IDBObjectStore}*/
					const store = tx.objectStore("settings");

					// Initialize IndexedDB

					try {
						const storedStrokeWeight = /**@type{IDBRequest<number>}*/ (
							store.get(IDBKeys.strokeWeight)
						);

						storedStrokeWeight.onerror = function () {
							this.#strokeWeight = 5;

							const updatedStrokeWeight = store.put(
								this.#strokeWeight,
								IDBkeys.strokeWeight,
							);

							updatedStrokeWeight.onerror = function () {
								console.error(updatedStrokeWeight.error);
								return;
							};

							updatedStrokeWeight.onsuccess = function () {
								console.log(
									"The updated values of stroke weight: ",
									updatedStrokeWeight.result,
								);
								return;
							};
						};

						storedStrokeWeight.onsucess = function () {
							this.strokeWeight = storedStrokeWeight.result;
						};
					} catch (e) {
						console.error(e);
						return;
					}

					const storedStrokeColor = /**@type{IDBRequest<string> | undefined}*/ (
						store.get(IDBKeys.strokeColor)
					);

					const defaultStrokeColor = "black";
					if (storedStrokeColor === undefined) {
						try {
							store.put(storedStrokeColor, IDBKeys.strokeColor);
						} catch (e) {
							console.error(e);
						}
					}
					this.#strokeColor = storedStrokeColor;

					let storedDrawingMode = await store.get(IDBKeys.drawingMode);
					if (storedDrawingMode === undefined) {
						storedDrawingMode = DrawingAction.DRAW;
						await store.put(storedDrawingMode, IDBKeys.drawingMode);
					}
					this.#drawingMode = storedDrawingMode;

					let screenRatioAsString = await store.get(IDBKeys.screenRatio);
					if (screenRatioAsString === undefined) {
						this.#screenRatio = window.devicePixelRatio;
						await store.put(this.#screenRatio, IDBKeys.screenRatio);
					} else {
						this.#screenRatio = screenRatioAsString;
					}

					this.#canvasRect = canvas.getBoundingClientRect();
					await store.put(this.#canvasRect, IDBKeys.canvasRect);

					let storedDrawing = await store.get(IDBKeys.currentDrawing);
					if (storedDrawing === undefined) {
						this.#currentDrawing = this.#drawing.name;
					} else {
						const storedDrawingAsObject = storedDrawing;
						this.#currentDrawing = storedDrawingAsObject.name;
						this.#drawing = storedDrawingAsObject;
					}

					this.ctx.lineWidth = this.#strokeWeight;
					this.ctx.strokeStyle = this.#strokeColor;
					this.ctx.lineCap = "round";
				})
				.catch((e) => {
					console.error(e);
					return;
				});

			this.canvas.addEventListener("pointerdown", (e) => {
				e.preventDefault();
				this.#startDrawing(e);
			});
			this.canvas.addEventListener("pointerup", (e) => {
				e.preventDefault();
				this.#stopDrawing();
			});
			this.canvas.addEventListener("pointercancel", (e) => {
				e.preventDefault();
				this.#stopDrawing();
			});
			this.canvas.addEventListener("pointermove", (e) => {
				e.preventDefault();
				this.#draw(e);
			});

			this.canvas.addEventListener("dblclick", function (e) {
				e.preventDefault();
			});

			// Prevent text selection on long press
			this.canvas.addEventListener("selectstart", function (e) {
				e.preventDefault();
			});

			this.toolBar.addEventListener(
				"change",
				this.#handleChangeEventOnToolBar.bind(this),
			);
			this.toolBar.addEventListener(
				"click",
				this.#handleClickEventOnToolBar.bind(this),
			);

			window.addEventListener("resize", () => {
				this.#resizeCanvas();
				this.#redrawCanvas();
			});

			window.addEventListener("load", () => {
				this.#resizeCanvas();
				this.#redrawCanvas();
			});
		}

		async #openIndexedDB() {
			return new Promise((resolve, reject) => {
				const request = window.indexedDB.open("DrawingAppDB", 1);

				request.onerror = (event) => {
					console.error("IndexedDB error:", event);
					reject(event);
				};

				request.onsuccess = function (event) {
					const request = /**@type{IDBOpenDBRequest | null}*/ (event.target);
					if (request === null) {
						console.error("Event target returned a null value");
						return;
					}
					resolve(request.result);
				};

				request.onupgradeneeded = (event) => {
					const request = /**@type{IDBOpenDBRequest | null}*/ (event.target);
					if (request === null) {
						console.error("Event target returned a null value");
						return;
					}

					const db = request.result;
					db.createObjectStore("settings");
					db.createObjectStore("drawings");
				};
			});
		}

		/**
		 * @param{PointerEvent} event
		 */
		#getPositions(event) {
			/**@type{PointT}*/
			const point = {
				x:
					(((event.clientX - this.#canvasRect.left) / this.#canvasRect.width) *
						this.canvas.width) /
					this.#screenRatio,

				y:
					(((event.clientY - this.#canvasRect.top) / this.#canvasRect.height) *
						this.canvas.height) /
					this.#screenRatio,
			};

			this.#position = point;
			this.#points.push(this.#position);
		}

		/**
		 * @param{PointerEvent} event
		 */
		#startDrawing(event) {
			this.#isDrawing = true;
			this.#getPositions(event);
		}

		#stopDrawing() {
			this.#isDrawing = false;

			/**@type{StrokeT}*/
			const newStroke = {
				points: this.#points,
				drawingMode: this.#drawingMode,
				weight: this.#strokeWeight,
				color: this.#strokeColor,
			};

			this.#drawing.strokes.push(newStroke);

			this.#openIndexedDB().then(async (db) => {
				const tx = db.transaction("drawings", "readwrite");
				const store = tx.objectStore("drawings");

				try {
					await store.put(this.#drawing, this.#drawing.name);
				} catch (e) {
					console.error(e);
					console.warn(
						"Your drawings are no longer being saved to IndexedDB, you have run out of space. You will need to export your canvas to save.",
					);
				} finally {
					this.#points = [];
				}
			});
		}

		/**@param{PointerEvent} event*/
		#draw(event) {
			if (!this.#isDrawing) return;
			this.ctx.lineWidth = this.#strokeWeight;
			this.ctx.strokeStyle = this.#strokeColor;
			this.ctx.lineCap = "round";
			this.ctx.beginPath();
			this.ctx.moveTo(this.#position.x, this.#position.y);
			this.#getPositions(event);
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

			this.#openIndexedDB().then(async (db) => {
				const tx = db.transaction("settings", "readwrite");
				const store = tx.objectStore("settings");

				try {
					await store.put(this.#screenRatio, IDBKeys.screenRatio);
				} catch (e) {
					console.error(e);
					throw new Error(
						`An error occurred when attempting to update the value of IndexedDB key: ${IDBKeys.screenRatio}`,
					);
				}

				const width = window.innerWidth * this.#screenRatio;
				const height = window.innerHeight * this.#screenRatio;
				this.ctx.canvas.style.width = window.innerWidth + "px";
				this.ctx.canvas.style.height = window.innerHeight + "px";
				this.ctx.canvas.width = width;
				this.ctx.canvas.height = height;

				this.#canvasRect = this.canvas.getBoundingClientRect();
				await store.put(this.#canvasRect, IDBKeys.canvasRect);

				this.ctx.scale(this.#screenRatio, this.#screenRatio); // Adjust drawing scale to account for the increased canvas size
			});
		}

		#redrawCanvas() {
			this.#openIndexedDB().then(async (db) => {
				const tx = db.transaction("drawings", "readonly");
				const store = tx.objectStore("drawings");

				const storedDrawingAsString = await store.get(this.#currentDrawing);
				if (storedDrawingAsString === undefined) {
					console.error(
						"Could not find any keys in IndexedDB with the name: ",
						this.#currentDrawing,
					);
					return;
				}

				const parsedStoredDrawing = storedDrawingAsString;
				if (
					!("name" in parsedStoredDrawing && "strokes" in parsedStoredDrawing)
				) {
					throw Error(
						"The current drawing was not of type DrawingT, could not redraw to canvas",
					);
				}

				this.#drawing = parsedStoredDrawing;

				const arrayOfStrokes = this.#drawing.strokes;
				let i = 0;
				strokeArrayLoop: while (i < arrayOfStrokes.length) {
					const currentStroke = arrayOfStrokes[i];
					this.ctx.lineCap = "round";
					this.ctx.lineWidth = currentStroke.weight;

					switch (currentStroke.drawingMode) {
						case DrawingAction.DRAW:
							this.ctx.globalCompositeOperation = "source-over";
							break;
						case DrawingAction.ERASE:
							this.ctx.globalCompositeOperation = "destination-out";
							break;
						default:
							console.error(
								"Invalid drawing mode was detected, could not draw current stroke",
							);
							continue strokeArrayLoop;
					}

					let j = 0;
					const currentStrokeArrayOfPoints = currentStroke.points;
					const currentStrokeArrayOfPointsLength =
						currentStrokeArrayOfPoints.length;
					while (j < currentStrokeArrayOfPointsLength - 1) {
						const currentPoint = currentStrokeArrayOfPoints[j];
						const nextPoint = currentStrokeArrayOfPoints[j + 1];
						this.ctx.beginPath();
						this.ctx.moveTo(currentPoint.x, currentPoint.y);
						this.ctx.lineTo(nextPoint.x, nextPoint.y);
						this.ctx.stroke();

						j++;
					}

					i++;
				}
			});
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
			console.error("Invalid context was provided, could not create context");
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

		const defaultCanvasName = "DEFAULT_CANVAS";

		const drawingApp = new DrawingApp(canvas, ctx, toolBar, defaultCanvasName);
		drawingApp;
	}
	main();
})();
