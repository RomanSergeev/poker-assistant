/*const freqTable = {
	// Letters
	B: 3, C: 1, D: 3, E: 3, F: 2, H: 7, K: 1, M: 8,
	N: 3, R: 1, S: 3, T: 6, W: 6, X: 7, Z: 4,

	// Digits
	3: 2, 4: 3, 5: 1, 7: 2, 8: 5, 9: 2,
};

// Build weighted pool
const pool = [];
for (const [char, count] of Object.entries(freqTable)) {
	for (let i = 0; i < count; i++) {
		pool.push(char);
	}
}*/
const pool = "\
TWBH48X3KM\
MT8M7H8TR8\
T4WMDTHMHC\
Z9XHSZEB4W\
WBE3HWCZEF\
MHSSR84XXZ\
SW5MHMDNN4\
9AFEPMG796\
A4EMAHFZZ2\
B4HZXCS9AN\
KDN328WSQ3\
EW7CN85KR7\
7SXBCTGJQN\
ARG77CV2MM\
S4VKGDEC7N\
V775RQ688W\
W8VEZ6EX64\
6P4ZKBQDEB\
TQ7DN2QMGA\
8PAN7XZDZ8\
WMJS4GHARP\
2NCAWRXGE8\
";

// First character: must be a letter
//const letters = Object.keys(freqTable).filter(ch => isNaN(ch));

function $(id) { return document.getElementById(id); }

function switchScenes() {
	if ($("scene1").style.display == "none") {
		$("scene1").style.display = "block";
		$("scene2").style.display = "none";
		document.body.style.overflow = "auto";
	} else {
		$("scene1").style.display = "none";
		$("scene2").style.display = "block";
		document.body.style.overflow = "none";
	}
}

function generateCode(length = 10) {
	var str;
	do {
		str = pool[Math.floor(Math.random() * pool.length)];
	} while (!isNaN(str));
    for (let i = 1; i < length; i++) {
		str += pool[Math.floor(Math.random() * pool.length)];
	}
	navigator.clipboard.writeText(str);
	document.getElementById("code").textContent = str;
}

function generateCode2(length = 10) {
	const alphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
	let str = "";
	for (let i = 0; i < length; i++) {
		const idx = Math.floor(Math.random() * alphabet.length);
		str += alphabet[idx];
	}
	navigator.clipboard.writeText(str);
	document.getElementById("code").textContent = str;
}

function generateCodeCall() { generateCode2(); }