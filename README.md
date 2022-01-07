# Furigana Annotations

Library to provide an improved way to do furigana annotations.

## Example

View https://furigana-annotations.atomicptr.de

Generally this works similar to normal Anki furigana annotations:

```
猫[ねこ]
```

the biggest advantage comes with words like 役に立つ where you had to write something like

```
役[やく]に 立[た]つ
```

before, which was always very annoying to me, so this library allows you to write something like this instead:

```
役に立つ[やく_た_]
```

as you can see this library keeps the word together and instead of splitting them up you can skip characters via "_".

## How to use with Anki

1. Copy the content from https://raw.githubusercontent.com/atomicptr/furigana-annotations/master/site/index.js
2. Put it into a script tag on your card template
3. Add the following snippet to your code:

```html
<script>
    window.addEventListener("load", () => {
        const parser = new FuriganaParser();
        document.querySelectorAll(".sentence").forEach(elem => {
            const text = elem.textContent.trim();
            elem.innerHTML = elem.classList.contains("render-pitch") ?
                    parser.renderPitchAccent(text) :
                    parser.render(text);
        });
    });
</script>
```

4. This will now parse all tags which have the class ".sentence" e.g. if you did something like this before:

```html
<div class="back">{{furigana:Sentence}}</div>
```

You'd need to do this now:

```html
<div class="back sentence">{{Sentence}}</div>
```

For the front you can keep using {{kanji:Sentence}} as this will strip the furigana completely anyway. Might need
to add a function for this too...

## License

MIT
