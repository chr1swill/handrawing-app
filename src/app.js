(function () {
	const DrawingAction = Object.freeze({
		DRAW: "0",
		ERASE: "1",
	});

	const localStorageKeys = Object.freeze({
		screenRatio: "currentScreenRatio",
		strokeWeight: "currentStrokeWeight",
		strokeColor: "currentStrokeColor",
		drawingMode: "currentDrawingMode",
		canvasRect: "currentCanvasRect",
		currentDrawing: "currentDrawing",
	});

	/**
	 * @typedef {Function} EventHandler
	 * @param {PointerEvent} e
	 * @returns{void}
	 */

	const eventdataIdJumpTable =
		/**@type{Readonly<{[key: string]: EventHandler}>}*/ (
			Object.freeze({
				"data-button-clear-canvas": function (e) {},
				"data-input-upload-file": function (e) {},
				"data-button-save-file": function (e) {},
				"data-slider-pencil": function (e) {},
				"data-slider-eraser": function (e) {},
				"data-input-stroke-weight": function (e) {},
			})
		);

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
					"Invalid paramater of class, could not instantiate",
				);
			}

			this.canvas = canvas;
			this.ctx = ctx;
			this.toolBar = toolBar;
			this.#drawing.name = name;
			this.#currentDrawing = name;
			if (localStorage.getItem(this.#currentDrawing) === null) {
				try {
					localStorage.setItem(
						this.#drawing.name,
						JSON.stringify(this.#drawing),
					);
				} catch (e) {
					console.error(e);
					return;
				}
			}

			this.#isDrawing = false;

			/**@type{string | number | null}*/
			let storedStrokeWeight = localStorage.getItem(
				localStorageKeys.strokeWeight,
			);
			if (storedStrokeWeight === null) {
				storedStrokeWeight = 5;
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

				this.#drawingMode = /**@type{DrawingActionT}*/ (storedDrawingMode);
			} else {
				this.#drawingMode = /**@type{DrawingActionT}*/ (storedDrawingMode);
			}

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

			let storedDrawing = localStorage.getItem(localStorageKeys.currentDrawing);
			if (storedDrawing === null) {
				this.#currentDrawing = this.#drawing.name;
			} else {
				/**@type{DrawingT}*/
				const storedDrawingAsObject = JSON.parse(storedDrawing);
				this.#currentDrawing = storedDrawingAsObject.name;
				this.#drawing = storedDrawingAsObject;
			}

			this.ctx.lineWidth = this.#strokeWeight;
			this.ctx.strokeStyle = this.#strokeColor;
			this.ctx.lineCap = "round";

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
				const tm = setTimeout(() => {
					this.#resizeCanvas();
					this.#redrawCanvas();
					clearTimeout(tm);
				}, 500);
			});

			window.addEventListener("load", () => {
				this.#resizeCanvas();
				this.#redrawCanvas();
			});
		}

		/**
		 * @param{PointerEvent} event
		 */
		#getPostions(event) {
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
			this.#getPostions(event);
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
				this.#points = [];
			}
		}

		/**@param{PointerEvent} event*/
		#draw(event) {
			if (!this.#isDrawing) return;
			this.ctx.lineWidth = this.#strokeWeight;
			this.ctx.strokeStyle = this.#strokeColor;
			this.ctx.lineCap = "round";
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
			const width = window.innerWidth * this.#screenRatio;
			const height = window.innerHeight * this.#screenRatio;
			this.ctx.canvas.style.width = window.innerWidth + "px";
			this.ctx.canvas.style.height = window.innerHeight + "px";
			this.ctx.canvas.width = width;
			this.ctx.canvas.height = height;

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

			this.ctx.scale(this.#screenRatio, this.#screenRatio); // Adjust drawing scale to account for the increased canvas size
		}

		#redrawCanvas() {
			if (
				this.#currentDrawing === "" ||
				this.#drawing.name === "" ||
				localStorage.getItem(this.#currentDrawing) === null
			) {
				let drawingName;
				retryPrompt: while (!drawingName || drawingName === "") {
					drawingName = prompt("Choose a name for your new drawing");
					if (drawingName && localStorage.getItem(drawingName) !== null) {
						console.warn(
							"You choose a name for a drawing that was already taken, please select another name",
						);
						drawingName = null;
						continue retryPrompt;
					} else {
						if (drawingName === null) continue retryPrompt;

						this.#currentDrawing = drawingName;
						break;
					}
				}

				this.#drawing.name = this.#currentDrawing;
			}

			const storedDrawingAsString = localStorage.getItem(this.#currentDrawing);
			if (storedDrawingAsString === null) {
				console.error(
					"Could not find any keys in localStorage with the name: ",
					this.#currentDrawing,
				);
				return;
			}

			const parsedStoredDrawing = JSON.parse(storedDrawingAsString);
			if (
				!("name" in parsedStoredDrawing && "strokes" in parsedStoredDrawing)
			) {
				throw Error(
					"The current drawing was not of type DrawingT, could not redraw to canvas",
				);
			}

			this.#drawing = /**@type{DrawingT}*/ (parsedStoredDrawing);

			const arrayOfStrokes = this.#drawing.strokes;
			let i = 0;
			strokeArrayLoop: while (i < arrayOfStrokes.length) {
				const currentStoke = arrayOfStrokes[i];
				this.ctx.lineCap = "round";
				this.ctx.lineWidth = currentStoke.weight;

				switch (currentStoke.drawingMode) {
					case DrawingAction.DRAW:
						this.ctx.globalCompositeOperation = "source-over";
						break;
					case DrawingAction.ERASE:
						this.ctx.globalCompositeOperation = "destination-out";
						break;
					default:
						console.error(
							"Invalid drawing mode was could, would not draw current stroke",
						);
						continue strokeArrayLoop;
				}

				let j = 0;
				const currentStokeArrayOfPoints = currentStoke.points;
				const currentStokeArrayOfPointsLength =
					currentStokeArrayOfPoints.length;
				while (j < currentStokeArrayOfPointsLength - 1) {
					const currentPoint = currentStokeArrayOfPoints[j];
					const nextPoint = currentStokeArrayOfPoints[j + 1];
					this.ctx.beginPath();
					this.ctx.moveTo(currentPoint.x, currentPoint.y);
					this.ctx.lineTo(nextPoint.x, nextPoint.y);
					this.ctx.stroke();

					j++;
				}

				i++;
			}
		}

		/**
		 * @param{PointerEvent} e
		 * @returns{void}
		 */
		#handleChangeEventOnToolBar(e) {
			const targetEl = /**@type{HTMLElement | null}*/ (e.target);
			if (targetEl === null) {
				console.error(
					"The an attempt to access the targeted element returned a null value",
				);
				return;
			}

			const targetedDataAttribute = targetEl.dataset;

			switch (true) {
				case "data-button-clear-canvas" in targetedDataAttribute:
					const result = window.confirm(
						"Are you sure you would like to clear drawing, doing so will perminently delete it?",
					);
					if (result === true) {
						this.#drawing.strokes = [];
						try {
							localStorage.setItem(
								this.#drawing.name,
								JSON.stringify(this.#drawing),
							);
						} catch (e) {
							console.error(e);
							return;
						}
					}

					break;
				case "data-input-upload-file" in targetedDataAttribute:
					break;
				case "data-button-save-file" in targetedDataAttribute:
					break;
				case "data-slider-pencil" in targetedDataAttribute:
					break;
				case "data-slider-eraser" in targetedDataAttribute:
					break;
				case "data-input-stroke-weight" in targetedDataAttribute:
					break;
				default:
					console.error("Unhandled event target: ", targetEl);
					break;
			}
		}

		/**
		 * @param{PointerEvent} e
		 * @returns{void}
		 */
		#handleClickEventOnToolBar(e) {
			const targetEl = /**@type{HTMLElement | null}*/ (e.target);
			if (targetEl === null) {
				console.error(
					"The an attempt to access the targeted element returned a null value",
				);
				return;
			}

			const targetedDataAttribute = targetEl.dataset;

			switch (true) {
				case "buttonClearCanvas" in targetedDataAttribute:
					const result = window.confirm(
						"Are you sure you would like to clear drawing, doing so will perminently delete it?",
					);
					if (result === true) {
						this.#drawing.strokes = [];
						try {
							localStorage.setItem(
								this.#drawing.name,
								JSON.stringify(this.#drawing),
							);
						} catch (e) {
							console.error(e);
							return;
						}
						this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
					}

					break;
				case "inputUploadFile" in targetedDataAttribute:
					break;
				case "buttonSaveFile" in targetedDataAttribute:
					let fileName;
					if (!("showSaveFilePicker" in window)) {
						while (!fileName || fileName.length < 1 || fileName.trim() === "") {
							fileName = window.prompt("Choose a name for your file");
						}
					}
					this.#saveToFile(fileName);
					break;
				case "sliderPencil" in targetedDataAttribute:
					break;
				case "sliderEraser" in targetedDataAttribute:
					break;
				case "inputStrokeWeight" in targetedDataAttribute:
					break;
				default:
					console.error(
						"Unhandled event target: ",
						targetEl,
						"\nTarget element dataset: ",
						targetEl.dataset,
					);
					break;
			}
		}

		/**
		 * @param{string | undefined} fileName
		 */
		async #saveToFile(fileName) {
			const self = this;
			if ("showSaveFilePicker" in window) {
				try {
					//@ts-ignore
					const fileHandle = await window.showSaveFilePicker({
						types: [
							{
								description: "TEXT data",
								accept: { "application/json": [".json"] },
							},
						],
					});

					const writable = await fileHandle.createWritable();
					const data = localStorage.getItem(self.#currentDrawing);
					if (data === null) {
						console.error(
							`There is no data in localStorage key: ${self.#currentDrawing}`,
						);
						alert(
							"Could not save file, the name is not in localStorage currently",
						);
						return;
					}

					let wroteData;
					try {
						wroteData = await writable.write(data);
					} catch (e) {
						wroteData = null;
						console.error(e);
						return;
					} finally {
						writable.close();
					}

					if (wroteData === null) {
						console.error("Failed to write data");
						return;
					}

					alert("Drawing save successfully!");
				} catch (e) {
					console.error(e);
					return;
				}
			} else {
				console.warn("FileSystem API no supported, using fallback");
				const data = localStorage.getItem(self.#currentDrawing);
				if (data === null) {
					console.error(
						`There is no data in localStorage key: ${self.#currentDrawing}`,
					);
					alert(
						"Could not save file, the name is not in localStorage currently",
					);
					return;
				}

				const blob = new Blob([data], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.style.display = "none";
				a.download = `${fileName}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		}
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
