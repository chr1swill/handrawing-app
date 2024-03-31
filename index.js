window.addEventListener("load", function () {
	resizeCanvas();
	loadCanvasFromLocalStorage();
});
window.addEventListener("resize", function () {
	resizeCanvas();
	loadCanvasFromLocalStorage();
});

function setupPointerEvents() {
	if (
		window.matchMedia("(hover:none)").matches &&
		navigator.maxTouchPoints < 0
	) {
		document.addEventListener(
			"touchstart",
			function (e) {
				if (e.target === canvas) e.preventDefault();
				startDrawing(e);
			},
			{ passive: false },
		);
		document.addEventListener(
			"touchend",
			function (e) {
				if (e.target === canvas) e.preventDefault();
				stopDrawing();
			},
			{ passive: false },
		);
		document.addEventListener(
			"touchmove",
			function (e) {
				if (e.target === canvas) e.preventDefault();
				sketch(e);
			},
			{ passive: false },
		);
		console.log("you are most likely on mobile");
	} else if (
		window.matchMedia("(hover: hover)").matches &&
		navigator.maxTouchPoints > 0
	) {
		console.log("you are most likely on desktop");
		document.addEventListener("mousedown", startDrawing);
		document.addEventListener("mouseup", stopDrawing);
		document.addEventListener("mousemove", sketch);
	} else {
		console.log("sorry buddy you get all the events");
		document.addEventListener("mousedown", startDrawing);
		document.addEventListener("mouseup", stopDrawing);
		document.addEventListener("mousemove", sketch);
		document.addEventListener(
			"touchstart",
			function (e) {
				if (e.target === canvas) e.preventDefault();
				startDrawing(e);
			},
			{ passive: false },
		);
		document.addEventListener(
			"touchend",
			function (e) {
				if (e.target === canvas) e.preventDefault();
				stopDrawing();
			},
			{ passive: false },
		);
		document.addEventListener(
			"touchmove",
			function (e) {
				if (e.target === canvas) e.preventDefault();
				sketch(e);
			},
			{ passive: false },
		);
	}
}

setupPointerEvents();

const canvas = /**@type{HTMLCanvasElement}*/ (
	document.querySelector("#myCanvas")
);
const ctx = /**@type{CanvasRenderingContext2D}*/ (canvas.getContext("2d"));

function resizeCanvas() {
	if (ctx) {
		const ratio = window.devicePixelRatio || 1;
		const width = window.innerWidth * ratio;
		const height = window.innerHeight * ratio;
		ctx.canvas.style.width = window.innerWidth + "px";
		ctx.canvas.style.height = window.innerHeight + "px";
		ctx.canvas.width = width;
		ctx.canvas.height = height;
		ctx.scale(ratio, ratio); // Adjust drawing scale to account for the increased canvas size
	}
}

let coord = { x: 0, y: 0 };

/**
 * @type {boolean}
 * flag used to trigger draw
 */
let draw = false;

/**
 * @param {MouseEvent|TouchEvent} event
 * updates the coordinates of the mouse to
 * match to be stored in the coord var when event
 * is tiggered
 */
function getPositions(event) {
	const rect = canvas.getBoundingClientRect(); // Get the bounding rectangle of the canvas
	const ratio = window.devicePixelRatio || 1;
	if (event instanceof TouchEvent) {
		// Calculate the x, y coordinates with scaling for device pixel ratio
		coord.x =
			(((event.touches[0].clientX - rect.left) / rect.width) * canvas.width) /
			ratio;
		coord.y =
			(((event.touches[0].clientY - rect.top) / rect.height) * canvas.height) /
			ratio;
	} else {
		// Adjust mouse event coordinates similarly if needed
		coord.x =
			(((event.clientX - rect.left) / rect.width) * canvas.width) / ratio;
		coord.y =
			(((event.clientY - rect.top) / rect.height) * canvas.height) / ratio;
	}
}

/**
 * @param {MouseEvent|TouchEvent} event
 * toggles flag to start the drawing
 */
function startDrawing(event) {
	draw = true;
	getPositions(event);
}

/**
 * toggles flag to stop the drawing
 */
function stopDrawing() {
	draw = false;
	saveCanvasToLocalStorage();
}

/**
 * @param {MouseEvent|TouchEvent} event
 * draw the path which you mouse follow when it is pressed down
 */
function sketch(event) {
	if (!draw) return;
	if (ctx) {
		ctx.beginPath();

		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.strokeStyle = "black";

		// the starting position on the line being set
		ctx.moveTo(coord.x, coord.y);

		// update the old coorditate with the new one from this event trigger
		getPositions(event);

		// connect the line segment from the prev coordinates to the current coordinates
		ctx.lineTo(coord.x, coord.y);

		// draw the line between the sigments applying the stoke styles
		ctx.stroke();
	}
}

function clearCavnas() {
	ctx?.clearRect(0, 0, canvas.width, canvas.height);
	localStorage.clear();
}

const clearButton = /**@type{HTMLButtonElement}*/ (
	document.getElementById("clearCanvas")
);
clearButton.onclick = function () {
	const createdContainerAlready = /**@type{HTMLDivElement|null}*/ (
		document.querySelector("[data-clear-canvas-modal]")
	);

	if (createdContainerAlready !== null) {
		if (createdContainerAlready?.style.display === "grid") {
			createdContainerAlready.style.display = "none";
			return;
		}
		createdContainerAlready.style.display = "grid";
		return;
	}

	const okButton = document.createElement("button");
	okButton.style.backgroundColor = "red";
	okButton.style.color = "white";
	okButton.style.fontSize = "16px";
	okButton.style.fontWeight = "bold";
	okButton.style.padding = "8px";
	okButton.style.border = "none";
	okButton.style.borderRadius = "8px";
	okButton.textContent = "Okay";

	const cancelButton = document.createElement("button");
	cancelButton.style.backgroundColor = "lightgray";
	cancelButton.style.color = "black";
	cancelButton.style.fontSize = "16px";
	cancelButton.style.fontWeight = "bold";
	cancelButton.style.padding = "8px";
	cancelButton.style.border = "none";
	cancelButton.style.borderRadius = "8px";
	cancelButton.textContent = "Cancel";

	const text = document.createElement("p");
	text.style.color = "black";
	text.style.fontSize = "18px";
	text.style.fontWeight = "bold";
	text.textContent = "Are you sure you would like to clear the canvas?";

	const container = document.createElement("div");
	container.setAttribute("data-clear-canvas-modal", "0");
	container.style.maxWidth = "400px";
	container.style.height = "auto";
	container.style.padding = "12px";
	container.style.backgroundColor = "white";
	container.style.color = "black";
	container.style.display = "grid";
	container.style.placeContent = "center";
	container.style.position = "absolute";
	// center the postition abosolute container in the middle of the screen
	container.style.top = "50%";
	container.style.left = "50%";
	container.style.transform = "translate(-50%, -50%)";

	/**@type{HTMLDivElement|null}*/
	let buttonContainer = document.createElement("div");
	buttonContainer.style.width = "100%";
	buttonContainer.style.height = "auto";
	buttonContainer.style.display = "grid";
	buttonContainer.style.gridTemplateColumns = "1fr 1fr";
	buttonContainer.style.gap = "10px";
	try {
		buttonContainer.append(cancelButton, okButton);
	} catch (e) {
		console.error(e);
		buttonContainer = null;
	}

	if (buttonContainer === null) {
		console.error("Failed to created button container");
		return;
	}

	container.append(text, buttonContainer);
	container.onclick = function (e) {
		e.preventDefault();
		if (!(e.target instanceof HTMLButtonElement)) return;

		switch (e.target) {
			case okButton:
				clearCavnas();
				container.style.display = "none";
				break;
			case cancelButton:
				container.style.display = "none";
				break;
		}
	};

	document.body.append(container);
};

//const saveButton = /**@type{HTMLButtonElement}*/ (
//document.getElementById("saveButton")
//);
// make this have some sort of sucess messgage the gets displayed
//saveButton.onclick = saveCanvasToLocalStorage;

function saveCanvasToLocalStorage() {
	try {
		localStorage.setItem("dataURL", canvas.toDataURL());
	} catch (e) {
		console.error("Storage failed: " + e);
		return;
	}
}

function loadCanvasFromLocalStorage() {
	const dataURL = localStorage.getItem("dataURL");
	if (dataURL === null) return;

	const img = new Image();
	img.src = dataURL;
	img.onload = function () {
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	};
}
