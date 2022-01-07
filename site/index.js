"use strict";
var FuriganaParser = /** @class */ (function () {
    function FuriganaParser(config) {
        if (config === void 0) { config = {}; }
        this.config = config;
        this.defaultConfig = {
            pitchUpToken: "/",
            pitchDownToken: "\\",
            characterSplitToken: "|",
            characterSkipToken: "_",
            wordSeparator: "|",
            disableWordSeparator: false,
        };
        this.wrapOutput = function (output) {
            return "<span class=\"word\">".concat(output, "</span>");
        };
    }
    FuriganaParser.prototype.render = function (payload, renderFunc) {
        var _a, _b;
        if (renderFunc === void 0) { renderFunc = this.createRubyTagFromAnnotation.bind(this); }
        var parsedAnnotations = this.findAnnotationsInPayload(payload);
        for (var _i = 0, parsedAnnotations_1 = parsedAnnotations; _i < parsedAnnotations_1.length; _i++) {
            var annotation = parsedAnnotations_1[_i];
            var rawAnnotation = annotation[0], // Example: 猫[ねこ]
            word = annotation[1], // Example: 猫
            annotationContent = annotation[2] // Example: ねこ
            ;
            payload = payload.replace(rawAnnotation, renderFunc(word, annotationContent));
        }
        var wordSeparator = (_a = this.config.wordSeparator) !== null && _a !== void 0 ? _a : this.defaultConfig.wordSeparator;
        var disableWordSeparator = (_b = this.config.disableWordSeparator) !== null && _b !== void 0 ? _b : this.defaultConfig.disableWordSeparator;
        if (!disableWordSeparator) {
            payload = payload.replace(wordSeparator, "");
        }
        return payload;
    };
    FuriganaParser.prototype.renderFurigana = function (payload) {
        return this.render(payload, this.createFurigana.bind(this));
    };
    FuriganaParser.prototype.renderPitchAccent = function (payload) {
        return this.render(payload, this.createPitchAccentNotation.bind(this));
    };
    FuriganaParser.prototype.findAnnotationsInPayload = function (payload) {
        var _a;
        var regex = new RegExp((_a = this.config.regex) !== null && _a !== void 0 ? _a : "(\\p{L}+)\\[([\\p{L}/\\\\_]+)\\]", "ugm");
        var result = [];
        var m = null;
        while ((m = regex.exec(payload)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            result.push(m);
        }
        return result;
    };
    FuriganaParser.prototype.createRubyTagFromAnnotation = function (word, annotationContent) {
        var parsedAnnotationContent = this.parseAnnotationContent(annotationContent);
        var renderAnnotation = function (annotation) { var _a; return (_a = annotation === null || annotation === void 0 ? void 0 : annotation.map(function (a) { return a.value; }).join("")) !== null && _a !== void 0 ? _a : ""; };
        var renderRuby = function (word, parsedAnnotation) {
            return "<ruby>".concat(word, "<rt>").concat(renderAnnotation(parsedAnnotation), "</rt></ruby>");
        };
        if (parsedAnnotationContent.length === 1) {
            return this.wrapOutput(renderRuby(word, parsedAnnotationContent[0]));
        }
        var wordMap = {};
        for (var i = 0; i < word.length; i++) {
            wordMap[word[i]] = parsedAnnotationContent[i];
        }
        var result = "";
        for (var _i = 0, _a = Object.keys(wordMap); _i < _a.length; _i++) {
            var wordPart = _a[_i];
            var annotations = wordMap[wordPart];
            // skip this character
            if (annotations === null) {
                result += wordPart;
                continue;
            }
            result += renderRuby(wordPart, annotations);
        }
        return result;
    };
    FuriganaParser.prototype.createFurigana = function (word, annotation) {
        return this.createPitchAccentNotation(word, annotation, true);
    };
    FuriganaParser.prototype.createPitchAccentNotation = function (word, annotation, ignoreClasses) {
        if (ignoreClasses === void 0) { ignoreClasses = false; }
        var parsedAnnotationContent = this.parseAnnotationContent(annotation);
        var wordMap = {};
        for (var i = 0; i < word.length; i++) {
            wordMap[word[i]] = parsedAnnotationContent[i];
        }
        var result = [];
        for (var _i = 0, _a = Object.keys(wordMap); _i < _a.length; _i++) {
            var part = _a[_i];
            var characters = wordMap[part];
            if (characters === undefined) {
                continue;
            }
            if (characters === null) {
                result.push(part);
            }
            for (var _b = 0, _c = characters; _b < _c.length; _b++) {
                var char = _c[_b];
                if (ignoreClasses) {
                    result.push(char.value);
                    continue;
                }
                var classes = ["furigana-character"];
                if (char.pitchUp) {
                    classes.push("pitch-up");
                }
                if (char.pitchDown) {
                    classes.push("pitch-down");
                }
                result.push("<span class=\"".concat(classes.join(" "), "\">").concat(char.value, "</span>"));
            }
        }
        return this.wrapOutput(result.join(""));
    };
    FuriganaParser.prototype.parseAnnotationContent = function (annotationContent) {
        var _a, _b, _c, _d;
        var result = [];
        var wordIndex = 0;
        var pitchUpToken = (_a = this.config.pitchUpToken) !== null && _a !== void 0 ? _a : this.defaultConfig.pitchUpToken;
        var pitchDownToken = (_b = this.config.pitchDownToken) !== null && _b !== void 0 ? _b : this.defaultConfig.pitchDownToken;
        var characterSplitToken = (_c = this.config.characterSplitToken) !== null && _c !== void 0 ? _c : this.defaultConfig.characterSplitToken;
        var characterSkipToken = (_d = this.config.characterSkipToken) !== null && _d !== void 0 ? _d : this.defaultConfig.characterSkipToken;
        for (var i = 0; i < annotationContent.length; i++) {
            var char = annotationContent[i];
            // character indicates pitch going up or down ignore, we'll process this later
            if (char === pitchUpToken || char === pitchDownToken) {
                continue;
            }
            // move kana to the next word
            if (char === characterSplitToken) {
                wordIndex++;
                continue;
            }
            // ignore next character
            if (char === characterSkipToken) {
                wordIndex += 2;
                result.push(null);
                continue;
            }
            if (!result[wordIndex]) {
                result[wordIndex] = [];
            }
            var elementBefore = i > 0 ? annotationContent[i - 1] : null;
            var nextElement = i < annotationContent.length - 1 ? annotationContent[i + 1] : null;
            var current = { value: char };
            if (elementBefore === pitchUpToken) {
                current.pitchUp = true;
            }
            if (nextElement === pitchDownToken) {
                current.pitchDown = true;
            }
            // @ts-ignore "Is possibly null", no it is not
            result[wordIndex].push(current);
        }
        return result;
    };
    return FuriganaParser;
}());
