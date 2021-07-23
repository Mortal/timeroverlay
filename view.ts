interface EventSpec {
	mode: "countdown" | "stopwatch";
	since: string;
	until: string;
	format: string;
	text: string;
}

interface ParsedEvent {
	computeText(currentTimeMillis: number): string;
	computeTime(currentTimeMillis: number): number;
	sinceMillis: number;
	untilMillis: number;
	keyHandlers: { [key: string]: (t: number, ev: KeyboardEvent) => void };
}

interface Part {
	align: string;
	extra: string;
	div: number;
	mod: number;
}

function parseTime(t: string): number {
	const mo = /^(\d+):(\d+)(?::(\d+(?:\.\d*)?))?$/.exec(t);
	return +mo[1] * 3600000 + +mo[2] * 60000 + +(mo[3] || "0") * 1000;
}

function parseEventSpec(eventSpec: EventSpec): ParsedEvent {
	let sinceMillis = parseTime(eventSpec.since);
	const untilMillis = parseTime(eventSpec.until);
	let paused = false;
	let elapsed = 0;
	const pattern = /m+|s+|f+/g;
	const [before, after] = eventSpec.text.split("{}");
	const parts: Part[] = [];
	for (; ;) {
		const i = pattern.lastIndex;
		const mo = pattern.exec(eventSpec.format);
		if (mo == null) break;
		const j = pattern.lastIndex;
		const align: string = mo[0].length > 1 ? "00000".slice(0, mo[0].length) : "";
		const extra = eventSpec.format.slice(i, j - mo[0].length);
		const c = mo[0].charAt(0);
		if (c === "m") parts.push({ align, extra, div: 60000, mod: 0 });
		else if (c === "s") parts.push({ align, extra, div: 1000, mod: 60 });
		else if (mo[0] === "f") parts.push({ align, extra, div: 100, mod: 10 });
		else if (mo[0] === "ff") parts.push({ align, extra, div: 10, mod: 100 });
		else if (mo[0] === "fff") parts.push({ align, extra, div: 1, mod: 1000 });
		else parts.push({ align, extra: extra + "???", div: 1, mod: 0 });
	}
	const mapPart = (t: number, { align, extra, div, mod }: Part) => {
		if (mod) {
			t = t % (mod * div);
		}
		t = (t / div) | 0;
		return extra + (align + t).substr(-align.length);
	};
	const computeText = (t: number) => before + (t < 0 ? "-" : "") + parts.map(
		(part) => mapPart(Math.abs(t), part)
	).join("") + after;
	const computeTime = (t: number) => (
		elapsed
		+ (paused ? 0 : (eventSpec.mode === "countdown" ? (untilMillis - t) : (t - sinceMillis)))
	);
	const keyHandlers = {};
	if (eventSpec.mode === "stopwatch") {
		keyHandlers["Space"] = (t: number) => {
			elapsed = computeTime(t);
			paused = !paused;
			sinceMillis = t;
		};
		keyHandlers["KeyR"] = (t: number) => {
			elapsed = 0;
			paused = true;
			sinceMillis = t;
		}
	}
	return { computeText, computeTime, sinceMillis, untilMillis, keyHandlers };
}

function setup(div: HTMLElement, design: { [k: string]: string }, eventSpecs: EventSpec[]) {
	for (const k of Object.keys(design)) div.style[k] = design[k];
	const nowDate = new Date();
	const midnight = +new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
	let i = 0;
	let e = parseEventSpec(eventSpecs[i]);

	const now = () => +new Date() - midnight;

	function keydown(ev: KeyboardEvent) {
		if (e.keyHandlers[ev.code]) {
			e.keyHandlers[ev.code](now(), ev);
			return;
		}
		if (ev.code === "ArrowLeft") {
			i -= 1;
		} else if (ev.code === "ArrowRight") {
			i += 1;
		} else {
			console.log({ code: ev.code })
			return;
		}
		i = Math.min(eventSpecs.length - 1, Math.max(0, i));
		e = parseEventSpec(eventSpecs[i]);
		ev.preventDefault();
		ev.stopPropagation();
	}

	function update() {
		const time = now();
		while (i + 1 < eventSpecs.length && e.untilMillis < time) {
			i += 1;
			e = parseEventSpec(eventSpecs[i]);
		}
		const t = e.computeTime(time);
		div.textContent = e.computeText(t);
	}

	const updateCallback = () => {
		update();
		window.requestAnimationFrame(updateCallback);
	}
	window.requestAnimationFrame(updateCallback);
	window.addEventListener("keydown", keydown, false);
}

// console.log(parseEventSpec({mode: "countdown", since: "01:00:00", until: "02:00:00", format: "ss", text: "{}"}).computeText(1996000))

window.addEventListener("load", () => {
	const div = document.getElementById("timeroverlay");

	const design = {
		fontFamily: "sans-serif",
		fontWeight: "700",
		backgroundColor: "#000",
		textShadow: "0 0 3px #111",
		color: "#dde",
		padding: "30px",
		display: "inline-block",
		width: "500px",
		textAlign: "center",
		height: "50px",
		fontSize: "40px",
	};

	const eventSpecs: EventSpec[] = [
		{
			mode: "countdown",
			since: "00:00:00",
			until: "14:55:00",
			format: "m:ss",
			text: "Next chug in {}",
		},
		{
			mode: "stopwatch",
			since: "14:55:00",
			until: "15:55:00",
			format: "m:ss.ff",
			text: "{}",
		},
		{
			mode: "countdown",
			since: "22:05:00",
			until: "22:30:00",
			format: "m:ss",
			text: "Next chug in {}",
		},
		{
			mode: "stopwatch",
			since: "22:30:00",
			until: "22:35:00",
			format: "m:ss.ff",
			text: "{}",
		},
		{
			mode: "countdown",
			since: "22:35:00",
			until: "23:00:00",
			format: "m:ss",
			text: "Next chug in {}",
		},
	];

	setup(div, design, eventSpecs);
}, false);
