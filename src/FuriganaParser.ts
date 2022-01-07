interface FuriganaParserConfig {
    regex?: string;
    pitchUpToken?: string;
    pitchDownToken?: string;
    characterSplitToken?: string;
    characterSkipToken?: string;
    wordSeparator?: string;
    disableWordSeparator?: boolean;
}

interface Kana {
    value: string,
    pitchUp?: boolean,
    pitchDown?: boolean
}

type RenderFunc = (word: string, annotation: string) => string;

class FuriganaParser {
    private defaultConfig = {
        pitchUpToken: "/",
        pitchDownToken: "\\",
        characterSplitToken: "|",
        characterSkipToken: "_",
        wordSeparator: "|",
        disableWordSeparator: false,
    }

    constructor(
        private config: FuriganaParserConfig = {}
    ) {}

    public render(payload: string, renderFunc: RenderFunc = this.createRubyTagFromAnnotation.bind(this)): string {
        const parsedAnnotations = this.findAnnotationsInPayload(payload);

        for (let annotation of parsedAnnotations) {
            const [
                rawAnnotation, // Example: 猫[ねこ]
                word, // Example: 猫
                annotationContent // Example: ねこ
            ] = annotation;
            payload = payload.replace(
                rawAnnotation,
                renderFunc(word, annotationContent)
            );
        }

        const wordSeparator = this.config.wordSeparator ?? this.defaultConfig.wordSeparator;
        const disableWordSeparator = this.config.disableWordSeparator ?? this.defaultConfig.disableWordSeparator;

        if (!disableWordSeparator) {
            payload = payload.replace(wordSeparator, "");
        }

        return payload;
    }

    public renderFurigana(payload: string): string {
        return this.render(payload, this.createFurigana.bind(this));
    }

    public renderPitchAccent(payload: string): string {
        return this.render(payload, this.createPitchAccentNotation.bind(this));
    }

    private findAnnotationsInPayload(payload: string) {
        const regex = new RegExp(
            this.config.regex ?? "(\\p{L}+)\\[([\\p{L}/\\\\_]+)\\]","ugm");
        const result = [];
        let m: RegExpExecArray|null = null;
        while ((m = regex.exec(payload)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            result.push(m);
        }
        return result;
    }

    private createRubyTagFromAnnotation(word: string, annotationContent: string): string {
        const parsedAnnotationContent = this.parseAnnotationContent(annotationContent);

        const renderAnnotation = (annotation: Kana[]|null): string =>
            annotation?.map(a => a.value).join("") ?? "";

        const renderRuby = (word: string, parsedAnnotation: Kana[]|null): string =>
            `<ruby>${word}<rt>${renderAnnotation(parsedAnnotation)}</rt></ruby>`;

        if (parsedAnnotationContent.length === 1) {
            return this.wrapOutput(renderRuby(word, parsedAnnotationContent[0]));
        }

        const wordMap: {[key: string]: Kana[]|null} = {};

        for (let i = 0; i < word.length; i++) {
            wordMap[word[i]] = parsedAnnotationContent[i];
        }

        let result = "";

        for (let wordPart of Object.keys(wordMap)) {
            const annotations = wordMap[wordPart];

            // skip this character
            if (annotations === null) {
                result += wordPart;
                continue;
            }

            result += renderRuby(wordPart, annotations);
        }

        return result;
    }

    private createFurigana(word: string, annotation: string): string {
        return this.createPitchAccentNotation(word, annotation, true);
    }

    private createPitchAccentNotation(word: string, annotation: string, ignoreClasses: boolean = false): string {
        const parsedAnnotationContent = this.parseAnnotationContent(annotation);

        const wordMap: {[key: string]: Kana[]|null} = {};

        for (let i = 0; i < word.length; i++) {
            wordMap[word[i]] = parsedAnnotationContent[i];
        }

        const result: string[] = [];

        for (let part of Object.keys(wordMap)) {
            const characters = wordMap[part];

            if (characters === undefined) {
                continue;
            }

            if (characters === null) {
                result.push(part);
            }

            for (let char of characters!) {
                if (ignoreClasses) {
                    result.push(char.value);
                    continue;
                }

                const classes = ["furigana-character"];

                if (char.pitchUp) {
                    classes.push("pitch-up");
                }

                if (char.pitchDown) {
                    classes.push("pitch-down");
                }

                result.push(`<span class="${classes.join(" ")}">${char.value}</span>`);
            }
        }

        return this.wrapOutput(result.join(""));
    }

    private wrapOutput = (output: string): string =>
        `<span class="word">${output}</span>`;

    private parseAnnotationContent(annotationContent: string): (Kana[]|null)[] {
        const result: (Kana[]|null)[] = [];
        let wordIndex = 0;

        const pitchUpToken = this.config.pitchUpToken ?? this.defaultConfig.pitchUpToken;
        const pitchDownToken = this.config.pitchDownToken ?? this.defaultConfig.pitchDownToken;
        const characterSplitToken = this.config.characterSplitToken ?? this.defaultConfig.characterSplitToken;
        const characterSkipToken = this.config.characterSkipToken ?? this.defaultConfig.characterSkipToken;

        for (let i = 0; i < annotationContent.length; i++) {
            const char = annotationContent[i];

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

            const elementBefore = i > 0 ? annotationContent[i - 1] : null;
            const nextElement = i < annotationContent.length - 1 ? annotationContent[i + 1] : null;

            const current: Kana = {value: char};

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
    }
}
