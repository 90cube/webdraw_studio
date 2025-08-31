## How to Fix the Problem

Programmatically associate labels with all form controls. The recommended method for most circumstances is to use the `label` element and an explicit association using the `for` and `id` attributes. The examples here are ordered from the most common acceptable solution to the least common acceptable solution.

```
<label for="firstname">First name:</label> <input type="text" id="firstname">
```

The label can also be *implicit* by wrapping the `<label>` element around the input:

```
<label>First name: <input type="text"></label>
```

If the input is already labeled visually some other way, such as through a magnifying glass icon on a search submit button, it may be acceptable to use `aria-label` to create an invisible text label for screen readers to read.

```
<input type="text" aria-label="Search">
```

An alternative method (sometimes used when adding a `<label>` tag would break functionality or styles, or when multiple labels apply to the same input), is to use `aria-labelledby` instead:

```
<div id="firstname">First name:</div> <input type="text" aria-labelledby="firstname">
```

```
<!--visual labels may be elsewhere in the content, such as in table headers-->
<div id="temperature">Temperature:</div>
<div id="high">High:</div>
<div id="low">Low:</div>
<!-- the inputs -->
<input type="text" aria-labelledby="temperature low">
<input type="text" aria-labelledby="temperature high">
```

Lastly a `placeholder` attribute may be used to give text inputs an accessible name. This is *not* a recommended solution as the visual label (the placeholder text) will be removed once the user enters text into the input, causing them to not know what the input is for.

```
<input type="text" placeholder="Search">
```

Also ensure that all `id` elements are unique on each page, and that the label text makes sense to someone listening to them with a screen reader.

### Form elements that should have labels

- Text entry fields, e.g. `<input type="text">`, `<input type="password">` and `<textarea>`
- Radio buttons, `<input type="radio">`
- Checkboxes, `<input type="checkbox">`

The only exceptions for this requirement are:

- Buttons - buttons are self-labeling
- Hidden inputs - Inputs with the type attribute value of hidden (e.g., `type="hidden"`). These inputs are hidden and unavailable for user input. They therefore need no label.

When adding labels, be sure to avoid the following:

```
First name: <input type="text" name="fname">
```

This markup renders to produce a textbox with the words "First name:" next to it. Sighted users have no problem associating the text with the input field. Nevertheless, this connection is not as clear for non-sighted users, especially as forms grow longer and more complex. This ambiguity can make errors more likely, especially when the information required is more complex than a first name.

For detailed instructions on how to implement these various labelling methods, see the Automated Checks that run as a part of this rule.

Finally, ensure that each `input` element has only one label. Note that if any of your `input` elements have help text, be sure this text differs from the `label` element text.

## Why it Matters

Effective form labels are required to make forms accessible. The purpose of form elements such as checkboxes, radio buttons, input fields, etcetera, is often apparent to sighted users, even if the form element is not programmatically labeled. Screen readers users require useful form labels to identify form fields. Adding a label to all form elements eliminates ambiguity and contributes to a more accessible product.

When labels for form elements are absent, screen reader users do not know the input data expectations. Screen readers cannot programmatically determine information about input objects without an established label relationship (or redundant text serving as a label).

The absence of labels prevent fields from receiving focus when read by screen readers, and users with impaired motor control do not get the benefit of a larger clickable area for the control since clicking the label activates the control.

## Rule Description

Each form element must have a programmatically associated label element.

## The Algorithm (in simple terms)

Ensures that every form element has a programmatically associated label.
