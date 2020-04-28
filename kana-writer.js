"use strict";

// The longest key name
const maxSubstringLength = Math.max(...Object.keys(Kana).map(s => s.length));

/**
 * Takes all text from the textarea input
 * and generates the hiragana and katakana "translations".
 *
 * @returns {void}
 */
function convertRomajiToKana() {
    const text        = document.getElementById("romaji-input").value;
    const lines       = text.split(/\n/);
    const wordsByLine = lines.map(line => line.split(/\s/));

    const convertedTexts = wordsByLine.map(words => {
        return words.map(word => convertWord(word.toLowerCase()))
    });

    const [hiragana, katakana] = ["hiragana", "katakana"].map(kanaType => {
        return convertedTexts.map(words => {
            return words.map(word => word[kanaType]).join(" ");
        }).join("<br>")
    });

    document.getElementById("output-hiragana").innerHTML = hiragana;
    document.getElementById("output-katakana").innerHTML = katakana;
}

/**
 * Converts provided Romaji text to Katakana and Hiragana,
 * as much as possible.
 *
 * @param   {String} romaji
 *
 * @returns {Object}
 */
function convertWord(romaji) {
    const hiragana = [];
    const katakana = [];

    let previousUnmatchedRomaji = "";
    let previousKanaLastVovel   = "";

    // Try each substring
    for (let i = 0; i < romaji.length; ++i) {
        let kanaFound = false;

        // Try longest possible substring first, then shorter ones
        for (let substringLength = maxSubstringLength; substringLength > 0; --substringLength) {
            if ((i + substringLength) > romaji.length) {
                // No enough characters left for this substring
                continue;
            }

            const part = romaji.substring(i, i + substringLength);

            if (!(part in Kana)) {
                // No match
                continue;
            }

            if (previousUnmatchedRomaji && previousUnmatchedRomaji === romaji[i]) {
                // Ah, so the previous unmatched romaji is actually
                // used to double the first consonant in this kana.
                // Remove the unmatched romaji.
                hiragana.pop();
                katakana.pop();

                // Insert the small "tsu" instead.
                hiragana.push(Kana["small-tsu"].Hiragana);
                katakana.push(Kana["small-tsu"].Katakana);
            }

            const kana = Kana[part];

            // This will be the result.
            hiragana.push(kana.Hiragana);

            if (previousKanaLastVovel !== ""
            && (previousKanaLastVovel === romaji[i] || (previousKanaLastVovel === "o" && romaji[i] === "u"))) {
                // We're doubling the same vovel
                katakana.push(Kana["long-vovel"].Katakana);
            } else {
                katakana.push(kana.Katakana);
            }

            kanaFound               = true;
            previousUnmatchedRomaji = "";
            previousKanaLastVovel   = part.split("").pop();

            // Skip all the characters this kana satisfies.
            i += substringLength - 1;

            break;
        }

        if (!kanaFound) {
            // No match found, so let's simply display
            // what the user has written in romaji.
            previousUnmatchedRomaji = romaji[i];

            hiragana.push(previousUnmatchedRomaji);
            katakana.push(previousUnmatchedRomaji);
        }
    }

    return {
        hiragana: hiragana.join(""),
        katakana: katakana.join("")
    };
}

// Translate what's there on page load
window.onload = () => {
    convertRomajiToKana();
};
