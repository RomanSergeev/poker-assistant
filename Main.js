const TYPES = 5;
const MINUTE = 60;
const CHIPS_HEIGHT_1 = 15;
const CHIPS_HEIGHT_2 = 2;
const SAVE_TIMER_EVERY_SECONDS = 5;
const IMG_PATH = "./Images/";
const IMG_NAMES = ["Chip white.png", "Chip green.png", "Chip red.png", "Chip blue.png", "Chip black.png"];
const maxChips = [50, 50, 100, 50, 50];
const BCN = { // body class names
	IN_GAME      : "playing"   , // the game has started: timer and/or blinds are on display
	LAST_BLINDS  : "done"      , // counter reached the last blinds pair, and is no more updated
	REBUYS       : "withRebuys", // whether playing with rebuys
	PERFECT_SPLIT: "evenChips"   // whether default chip assignment is enough
};
const CN = { // cookie names (not the full list)
	PAUSED   : "paused"      , // whether game is paused (boolean)
	ALERTS   : "soundEnabled", // whether warning sounds for blind raising must be played (boolean)
	IN_GAME  : "playing"     , // whether the game is in process (boolean)
	INDEX_SB : "indexSB"     , // index of current small blind in an array of all SBs
	INDEX_BB : "indexBB"     , // index of current big blind in an array of all BBs
	TIME_LEFT: "timer"       , // time left (seconds) in the current blinds round before blinds raise
	LANGUAGE : "language"      // see i18n.js, applyI18n
};
// cookie-bound variables
var playing = false;
var paused = false;
var timeLeft = 0;
var sound = true;
var blindsSmall = [], blindsBig = [], blindIndexSmall = 0, blindIndexBig = 0;

var inputsAll;
var btnTexts;

function num(index) { return +inputsAll[index].value; }
function set(id, text) { $(id).textContent = text; }
function getBlinds(id) { return $(id).value.split(" ").map(x => +x).filter(x => x); }
function updateTextBlinds(idxSB, idxBB) { set("blinds", btnTexts.txtBlinds + blindsSmall[idxSB] + " / " + blindsBig[idxBB]); }
function updateTextPaused() { set("pause", paused ? btnTexts.btnPlay : btnTexts.btnPause); }
function updateTextSound () { set("soundToggle", sound ? btnTexts.sndRemove : btnTexts.sndRetain); }
function hasCookie(name) { return Cookies.get(name) !== undefined; }
function setPaused(p) { Cookies.set(CN.PAUSED, paused = p); updateTextPaused(); }
function enableSound(doEnable) { Cookies.set(CN.ALERTS, sound = doEnable); updateTextSound(); }
function tcn(name, turnOn) { if (turnOn) document.body.classList.add(name); else document.body.classList.remove(name); } // toggle class name
function switchLanguage() { applyI18n(language == "RU" ? "EN" : "RU"); }
function applyToAllInputs(f) {
	for (var input in inputsAll)
		f(inputsAll[input]);
}

function setPlaying(play, indexSB = 0, indexBB = 0, pause = false, time = -1) {
	Cookies.set(CN.IN_GAME, playing = play);
	tcn(BCN.IN_GAME, play);
	if (play) {
		blindsSmall = getBlinds("inputSB");
		blindsBig   = getBlinds("inputBB");
		if (blindsSmall.length == 0) blindsSmall = [0];
		if (blindsBig  .length == 0) blindsBig   = [0];
		Cookies.set(CN.INDEX_SB, blindIndexSmall = indexSB);
		Cookies.set(CN.INDEX_BB, blindIndexBig   = indexBB);
		setPaused(pause);
		if (time > 0) // for time saved/loaded via cookies
			resetTimer(time);
		else
			resetTimer();
		$("chip1").setAttribute("disabled", "");
		applyToAllInputs(input => input.disabled = " ");
	} else {
		Cookies.remove(CN.TIME_LEFT);
		tcn(BCN.LAST_BLINDS, false); // just for a clean classname
		applyToAllInputs(input => input.removeAttribute("disabled"));
	}
}

function resetTimer(time) {
	if (arguments.length == 0) time = MINUTE * num(5);
	Cookies.set(CN.TIME_LEFT, timeLeft = time);
	tcn(BCN.LAST_BLINDS,
		blindIndexSmall == blindsSmall.length - 1 &&
		blindIndexBig   == blindsBig  .length - 1);
	updateTextBlinds(blindIndexSmall, blindIndexBig);
}

function updateTimerText() {
	var mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
	var str = mins + ":" + (secs < 10 ? "0" : "") + secs;
	set("timer", str);
}

function runTimer() {
	if (!playing || paused) {
		setTimeout(runTimer, 1000);
		return;
	}
	updateTimerText();
	if (playing && !document.body.classList.contains(BCN.LAST_BLINDS) && sound) {
		if (timeLeft == MINUTE || (timeLeft < 4 && timeLeft > 0)) $("beepShort").play(); // warn beep at 1 minute, and 3 times before raise
		if (timeLeft == 0) $("beepLong").play();
	}
	if (timeLeft) {
		--timeLeft;
		if (timeLeft % SAVE_TIMER_EVERY_SECONDS == 0)
			Cookies.set(CN.TIME_LEFT, timeLeft);
	} else {
		if (blindIndexSmall < blindsSmall.length - 1) Cookies.set(CN.INDEX_SB, ++blindIndexSmall);
		if (blindIndexBig   < blindsBig  .length - 1) Cookies.set(CN.INDEX_BB, ++blindIndexBig  );
		resetTimer();
	}
	setTimeout(runTimer, 1000);
}

function bindCookieToInput(inputId, cookieName) {
	if (hasCookie(cookieName)) $(inputId).value = Cookies.get(cookieName);
	else Cookies.set(cookieName, $(inputId).value);
	$(inputId).addEventListener("change", () => Cookies.set(cookieName, $(inputId).value) );
}

document.addEventListener("DOMContentLoaded", function() {
	inputsAll = Array.from(document.querySelectorAll("input"));
	applyToAllInputs(input => input.addEventListener("change", recalculate));
	recalculate();
	
	var imgs = document.querySelectorAll("img");
	for (var i = 0; i < TYPES; ++i)
		imgs[i].src = IMG_PATH + IMG_NAMES[i];
	
	// can be done with styles only
	var ch = $("startChipsHolder");
	for (var i = 0; i < TYPES; ++i) {
		ch.children[i].style.backgroundImage = 'url("' + IMG_PATH + IMG_NAMES[i] + '")';
		ch.children[i].style.left = i * (CHIPS_HEIGHT_2 / 2) + "rem";
	}
	
	$("start").addEventListener("click", () => setPlaying(true ) );
	$("stop" ).addEventListener("click", () => setPlaying(false) );
	$("stop2").addEventListener("click", () => setPlaying(false) );
	$("pause").addEventListener("click", () => setPaused(!paused));
	$("langImage").addEventListener("click", switchLanguage);
	$("soundToggle").addEventListener("click", () => enableSound(!sound));
	bindCookieToInput("chip1"    , "chipValueWhite" );
	bindCookieToInput("chip2"    , "chipValueGreen" );
	bindCookieToInput("chip3"    , "chipValueRed"   );
	bindCookieToInput("chip4"    , "chipValueBlue"  );
	bindCookieToInput("chip5"    , "chipValueBlack" );
	bindCookieToInput("inputSB"  , "SBs"            );
	bindCookieToInput("inputBB"  , "BBs"            );
	bindCookieToInput("timerMins", "roundMinutes"   );
	bindCookieToInput("ppl"      , "numPlayers"     );
	bindCookieToInput("rebuys"   , "numRebuys"      );
	bindCookieToInput("rebuyPC"  , "rebuyPercentage");
	if (hasCookie(CN.LANGUAGE))
		applyI18n(Cookies.get(CN.LANGUAGE));
	else applyI18n("RU");
	if (hasCookie(CN.ALERTS))
		enableSound(Cookies.get(CN.ALERTS) == "true");
	else enableSound(sound);
	if (hasCookie(CN.IN_GAME))
		setPlaying(
			Cookies.get(CN.IN_GAME  ) == "true",
			Cookies.get(CN.INDEX_SB ),
			Cookies.get(CN.INDEX_BB ),
			Cookies.get(CN.PAUSED   ) == "true",
			Cookies.get(CN.TIME_LEFT)
		);
	else
		setPlaying(false);
	runTimer();
});

// update span texts based on input values
function recalculate() {
	var nom = [num(0), num(1), num(2), num(3), num(4)]; // nominals
	var sumNominals = nom[0] + nom[1] + 2*nom[2] + nom[3] + nom[4];
	var totalBank = sumNominals * 50;
	var players = num(8), rebuys = num(9), rebuyPC = num(10);
	
	var playerDesiredStack = totalBank / players;
	var startPercentage = 1 - rebuys * rebuyPC / 100;
	var stackStart = Math.floor(playerDesiredStack * startPercentage), stackRebuy = 0;
	if (rebuys > 0) stackRebuy = Math.floor((playerDesiredStack - stackStart) / rebuys);
	
	set("bank", totalBank);
	set("stack", stackStart);
	set("stackRebuy", stackRebuy);
	tcn(BCN.REBUYS, stackRebuy);
	
	var ecc = Math.floor(stackStart / sumNominals); // equalChipCount
	var startChips = [ecc, ecc, 2*ecc, ecc, ecc];
	var remainder = stackStart % sumNominals;
	set("startChips1", startChips[0]);
	set("startChips2", startChips[1]);
	set("startChips3", startChips[2]);
	set("startChips4", startChips[3]);
	set("startChips5", startChips[4]);
	set("plus", "+ " + remainder);
	tcn(BCN.PERFECT_SPLIT, !remainder);
}

// debug purposes: log existing cookies as an object. By ChatGPT
function logCookies() {
	var cookies = document.cookie.split('; ').reduce((acc, cookie) => {
		var [key, value] = cookie.split('=');
		acc[key] = value;
		return acc;
	}, {});
	console.log(cookies);
}

// wakeLock: keep the screen on (by ChatGPT)
let wakeLock = null;

async function enableWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Screen wake lock enabled.");
    } catch (err) {
        console.error("Failed to enable wake lock:", err);
    }
}

function disableWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
        console.log("Screen wake lock disabled.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    enableWakeLock();
	generateCodeCall();
});

// language setting
function applyI18n(lang) {
	Cookies.set(CN.LANGUAGE, language = lang);
	btnTexts = Object.assign({}, LANG[lang]); // copy from i18n.js
	const ids = btnTexts.ID;
	for (const id in ids) {
		if (!ids.hasOwnProperty(id)) continue;
		$(id).textContent = ids[id];
	}
	updateTextBlinds(blindIndexSmall, blindIndexBig);
	updateTextPaused();
	updateTextSound ();
	$("langImage").src = btnTexts.imgsrc;
	delete btnTexts.ID; // retain only texts that change via JS
}