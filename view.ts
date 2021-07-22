const design = {
	fontFamily: "sans-serif",
	fontWeight: "700",
	backgroundColor: "#111",
	color: "#dde",
	padding: "30px",
	display: "inline-block",
};
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
}
const eventSpecs: EventSpec[] = [
	{
		mode: "countdown",
		since: "21:05:00",
		until: "22:00:00",
		format: "m:ss",
		text: "Next chug in {}",
	},
	{
		mode: "stopwatch",
		since: "22:00:00",
		until: "22:05:00",
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
function parseTime(t: string): number {
	const mo = /^(\d+):(\d+):(\d+)$/.exec(t);
	return +mo[1] * 3600000 + +mo[2] * 60000 + +mo[3] * 1000;
}
interface Part {
	align: string;
	extra: string;
	div: number;
	mod: number;
}
function parseEventSpec(eventSpec: EventSpec): ParsedEvent {
	const sinceMillis = parseTime(eventSpec.since);
	const untilMillis = parseTime(eventSpec.until);
	const pattern = /m+|s+|f+/g;
	const [before, after] = eventSpec.text.split("{}");
	const parts: Part[] = [];
	for (;;) {
		const i = pattern.lastIndex;
		const mo = pattern.exec(eventSpec.format);
		if (mo == null) break;
		const j = pattern.lastIndex;
		const align: string = mo[0].length > 1 ? "00000".slice(0, mo[0].length) : "";
		const extra = (i ? "" : before) + eventSpec.format.slice(i, j - mo[0].length);
		const c = mo[0].charAt(0);
		if (c === "m") parts.push({align, extra, div: 60000, mod: 0});
		else if (c === "s") parts.push({align, extra, div: 1000, mod: 60});
		else if (mo[0] === "f") parts.push({align, extra, div: 100, mod: 10});
		else if (mo[0] === "ff") parts.push({align, extra, div: 10, mod: 100});
		else if (mo[0] === "fff") parts.push({align, extra, div: 1, mod: 1000});
		else parts.push({align, extra: extra + "???", div: 1, mod: 0});
	}
	const computeText = (t: number) => parts.map(({align, extra, div, mod}) => extra + (align + (((mod ? (t % (mod * div)) : t) / div)|0)).substr(-align.length)).join("") + after;
	const computeTime = (t: number) => (eventSpec.mode === "countdown" ? (untilMillis - t) : (t - sinceMillis));
	return {computeText, computeTime, sinceMillis, untilMillis};
}
// console.log(parseEventSpec({mode: "countdown", since: "01:00:00", until: "02:00:00", format: "ss", text: "{}"}).computeText(1996000))
function setup() {
	const div = document.getElementById("timeroverlay");
	for (const k of Object.keys(design)) div.style[k] = design[k];
	const now = new Date();
	const midnight = +new Date(now.getFullYear(), now.getMonth(), now.getDate());
	let i = 0;
	let e = parseEventSpec(eventSpecs[i]);
	function keydown(ev: KeyboardEvent) {
		if (ev.code === "ArrowLeft") {
			i -= 1;
		}
		if (ev.code === "ArrowRight") {
			i += 1;
		}
		console.log({i})
		i = Math.min(eventSpecs.length - 1, Math.max(0, i));
		e = parseEventSpec(eventSpecs[i]);
	}
	window.addEventListener("keydown", keydown, false);
	function update() {
		const time = +new Date() - midnight;
		while (i + 1 < eventSpecs.length && e.untilMillis < time) {
			i += 1;
			e = parseEventSpec(eventSpecs[i]);
		}
		const t = e.computeTime(time);
		// console.log({t})
		div.textContent = e.computeText(t);
		window.requestAnimationFrame(update);
	}
	window.requestAnimationFrame(update);
}
window.addEventListener("load", setup, false)