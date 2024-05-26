const DEBUG_MODE = false;

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

		/**@type{number}*/
		#pointerId = 0;

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
			this.canvas.style.touchAction = "none"; // Prevent touch actions like zooming and scrolling
			this.canvas.style.userSelect = "none"; // Disable text selection

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
				if (storedDrawingMode === DrawingAction.ERASE) {
					const overlay2 = /**@type{HTMLElement|null}*/ (
						document.querySelector("[data-slider-overlay]")
					);
					if (overlay2 === null) {
						console.error(
							"Could not find element with attribute: data-slider-overlay",
						);
						return;
					}

					const span2 = overlay2.querySelector("span");
					if (span2 === null) {
						console.error("Could not find span inside overlay");
						return;
					}

					overlay2.style.justifyContent = "flex-end";
					span2.style.transform = "translateX(-4px)";
					this.ctx.globalCompositeOperation = "destination-out";
				}
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

			this.canvas.addEventListener(
				"touchstart",
				(e) => {
					e.preventDefault();
					this.#startDrawing(e);
				},
				{ passive: false },
			);
			this.canvas.addEventListener(
				"touchend",
				(e) => {
					e.preventDefault();
					this.#stopDrawing();
				},
				{ passive: false },
			);
			this.canvas.addEventListener(
				"touchcancel",
				(e) => {
					e.preventDefault();
					this.#stopDrawing();
				},
				{ passive: false },
			);
			this.canvas.addEventListener(
				"touchmove",
				(e) => {
					e.preventDefault();
					this.#draw(e);
				},
				{ passive: false },
			);

			this.canvas.addEventListener("contextmenu", function (e) {
				console.log("firred context menu event");
				e.preventDefault();
			});

			this.canvas.addEventListener("dblclick", function (e) {
				console.log("firred db click event");
				e.preventDefault();
			});

			// Prevent text selection on long press
			this.canvas.addEventListener("selectstart", function (e) {
				e.preventDefault();
			});

			this.toolBar.addEventListener("change", (e) => {
				this.#handleEventsOnToolBar(e);
			});

			this.toolBar.addEventListener("click", (e) => {
				this.#handleEventsOnToolBar(e);
			});

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
		 * @param{TouchEvent} event
		 */
		#getPostions(event) {
			/**@type{PointT}*/
			const point = {
				x:
					(((event.touches[0].clientX - this.#canvasRect.left) /
						this.#canvasRect.width) *
						this.canvas.width) /
					this.#screenRatio,

				y:
					(((event.touches[0].clientY - this.#canvasRect.top) /
						this.#canvasRect.height) *
						this.canvas.height) /
					this.#screenRatio,
			};

			this.#position = point;
			this.#points.push(this.#position);
			if (DEBUG_MODE === true) {
				console.log("\n");
				console.log("FROM: DrawingApp.#getPositions end");
				console.log("\n");
				console.log("event time : ", event.timeStamp);
				console.log("event target", event.target);
				console.log("pointer type: ", event.pointerType);
				console.log("pointer id: ", event.pointerId);
			}
		}

		/**
		 * @param{TouchEvent} event
		 */
		#startDrawing(event) {
			if (DEBUG_MODE === true) {
				console.log("\n");
				console.log("FROM: DrawingApp.#startDrawing start");
				console.log("\n");
				console.log("event time : ", event.timeStamp);
				console.log("event target", event.target);
				console.log("pointer type: ", event.pointerType);
				console.log("pointer id: ", event.pointerId);
			}
			this.#pointerId = event.pointerId;
			this.#isDrawing = true;
			this.#getPostions(event);
			//@ts-ignore
			event.target.releasePointerCapture(this.#pointerId);
		}

		#stopDrawing() {
			this.canvas.releasePointerCapture(this.#pointerId);
			this.#isDrawing = false;

			/**@type{StrokeT}*/
			const newStroke = {
				points: this.#points,
				drawingMode: this.#drawingMode,
				weight: this.#strokeWeight,
				color: this.#strokeColor,
			};

			const newStrokeAsString = JSON.stringify(newStroke);

			//this.#drawing.strokes.push(newStroke);
			try {
				/**@type{string | null}*/
				const currentDrawing = localStorage[this.#currentDrawing];
				if (currentDrawing === null) {
					throw new ReferenceError(
						"Could not access current drawing in the way you are attempting to do so",
					);
				}

				if (currentDrawing.slice(currentDrawing.length - 3) === "[]}") {
					localStorage[this.#currentDrawing] =
						currentDrawing.slice(0, currentDrawing.length - 2) +
						newStrokeAsString +
						"]}";
				} else {
					localStorage[this.#currentDrawing] =
						currentDrawing.slice(0, currentDrawing.length - 2) +
						"," +
						newStrokeAsString +
						"]}";
				}
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
		 * @param{Event} e
		 * @returns{void}
		 */
		#handleEventsOnToolBar(e) {
			const self = this;

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
						self.#drawing.strokes = [];
						try {
							localStorage.setItem(
								self.#drawing.name,
								JSON.stringify(self.#drawing),
							);
						} catch (e) {
							console.error(e);
							return;
						}
						self.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
					}

					break;

				case "inputUploadFile" in targetedDataAttribute:
					if (e.type === "click") return;

					const uploadFileInput = /**@type{HTMLInputElement | null}*/ (
						document.querySelector("[data-input-upload-file] input")
					);
					if (uploadFileInput === null) {
						console.error(
							"Could not find input element with data attribute: data-input-upload-file",
						);
						return;
					}

					const fileReader = new FileReader();

					fileReader.onerror = function () {
						console.error(fileReader.error);
						return;
					};

					fileReader.onload = function () {
						const file = /**@type{string}*/ (fileReader.result);
						const parsedFile = JSON.parse(file);

						// verify shape
						if (
							typeof parsedFile !== "object" ||
							!("name" in parsedFile) ||
							!("strokes" in parsedFile) ||
							typeof parsedFile.name !== "string" ||
							typeof parsedFile.strokes !== "object"
						) {
							console.error(
								"Invalid file was provided, file could not be uploaded",
								parsedFile,
							);
							return;
						}

						const verifiedFile = /**@type{DrawingT}*/ (parsedFile);

						const checkIfFileWithSameNameInLocalStorage = localStorage.getItem(
							verifiedFile.name,
						);
						if (checkIfFileWithSameNameInLocalStorage !== null) {
							// let them change name > keep both
							// replace file > keep uploaded file
							// abort > keep old file
							//
							// PROMPTS:
							// You current have a drawing with the name as the file you just uploaded, would you like to keep both?
							// would you like to replace the old file with the file you just uploaded?
							// please select a new name for the uploaded file ( must not match any of the keys in local storage you must verify the inputed name )

							const confirmOne = window.confirm(
								"You current have a drawing with the same name as the uploaded drawing, would you like to keep both of them?",
							);

							if (confirmOne === true) {
								/**@type{string | null}*/
								let promptOne = null;
								while (
									!promptOne ||
									promptOne.trim() === "" ||
									localStorage.getItem(promptOne) !== null
								) {
									promptOne = window.prompt(
										"Choose a new name for the uploaded drawing",
									);
								}

								verifiedFile.name = promptOne;
								try {
									localStorage.setItem(verifiedFile.name, file);
								} catch (e) {
									console.error(e);
									return;
								}

								self.#drawing.name = verifiedFile.name;
								self.#drawing.strokes = verifiedFile.strokes;

								self.#currentDrawing = promptOne;
								try {
									localStorage.setItem(
										localStorageKeys.currentDrawing,
										self.#currentDrawing,
									);
								} catch (e) {
									console.error(e);
									return;
								}

								self.#redrawCanvas();
								return;
							} else {
								const confirmTwo = window.confirm(
									"Would you like to replace the old drawing with the drawing you just uploaded? (Doing this will permanently default the old drawing)",
								);

								if (confirmTwo === true) {
									try {
										localStorage.setItem(verifiedFile.name, file);
									} catch (e) {
										console.error(e);
									}

									self.#drawing = verifiedFile;

									self.#redrawCanvas();
									return;
								} else {
									const confirmThree = window.confirm(
										"Would you like to replace the old drawing with the drawing you just uploaded? (Doing this will permanently default the old drawing)",
									);

									if (confirmThree === true) {
										/**@type{string | null}*/
										let promptOne = null;
										while (
											!promptOne ||
											promptOne.trim() === "" ||
											localStorage.getItem(promptOne) !== null
										) {
											promptOne = window.prompt(
												"Choose a new name for the uploaded drawing",
											);
										}

										verifiedFile.name = promptOne;
										try {
											localStorage.setItem(verifiedFile.name, file);
										} catch (e) {
											console.error(e);
											return;
										}

										self.#drawing.name = verifiedFile.name;
										self.#drawing.strokes = verifiedFile.strokes;

										self.#currentDrawing = promptOne;
										try {
											localStorage.setItem(
												localStorageKeys.currentDrawing,
												self.#currentDrawing,
											);
										} catch (e) {
											console.error(e);
											return;
										}

										self.#redrawCanvas();
										return;
									} else {
										return;
									}
								}
							}
						} else {
							try {
								localStorage.setItem(verifiedFile.name, file);
							} catch (e) {
								console.error(e);
								return;
							}

							self.#drawing = verifiedFile;
							self.#currentDrawing = verifiedFile.name;
							try {
								localStorage.setItem(
									localStorageKeys.currentDrawing,
									self.#currentDrawing,
								);
							} catch (e) {
								console.error(e);
								return;
							}

							self.#redrawCanvas();
							alert("Drawing saved sucessfully");
							return;
						}
					};

					if (uploadFileInput.files === null) {
						console.error("There was no file uploaded");
						return;
					}

					fileReader.readAsText(uploadFileInput.files[0]);
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
					let overlay = /**@type{HTMLElement|null}*/ (
						document.querySelector("[data-slider-overlay]")
					);
					if (overlay === null) {
						console.error(
							"Could not find element with attribute: data-slider-overlay",
						);
						return;
					}

					let span = overlay.querySelector("span");
					if (span === null) {
						console.error("Could not find span inside overlay");
						return;
					}

					overlay.style.justifyContent = "flex-start";
					span.style.transform = "translateX(4px)";
					self.ctx.globalCompositeOperation = "source-over";

					self.#drawingMode = DrawingAction.DRAW;
					try {
						localStorage.setItem(
							localStorageKeys.drawingMode,
							self.#drawingMode,
						);
					} catch (e) {
						console.error(e);
						return;
					}

					break;

				case "sliderEraser" in targetedDataAttribute:
					const overlay2 = /**@type{HTMLElement|null}*/ (
						document.querySelector("[data-slider-overlay]")
					);
					if (overlay2 === null) {
						console.error(
							"Could not find element with attribute: data-slider-overlay",
						);
						return;
					}

					const span2 = overlay2.querySelector("span");
					if (span2 === null) {
						console.error("Could not find span inside overlay");
						return;
					}

					overlay2.style.justifyContent = "flex-end";
					span2.style.transform = "translateX(-4px)";
					self.ctx.globalCompositeOperation = "destination-out";

					self.#drawingMode = DrawingAction.ERASE;
					try {
						localStorage.setItem(
							localStorageKeys.drawingMode,
							self.#drawingMode,
						);
					} catch (e) {
						console.error(e);
						return;
					}
					break;

				case "inputStrokeWeight" in targetedDataAttribute:
					const strokeWeightInput = /**@type{HTMLInputElement | null}*/ (
						document.querySelector("[data-input-stroke-weight]")
					);
					if (strokeWeightInput === null) {
						console.error(
							"Could not find input element with data attribute: [data-input-stroke-weight]",
						);
						return;
					}

					self.#strokeWeight = strokeWeightInput.valueAsNumber;
					try {
						localStorage.setItem(
							localStorageKeys.strokeWeight,
							strokeWeightInput.value,
						);
					} catch (e) {
						console.error(e);
						return;
					}

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
