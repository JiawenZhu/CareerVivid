/**
 * CareerVivid Auto-Apply — Fill Utilities
 *
 * Low-level DOM manipulation helpers used by all ATS adapters.
 *
 * The key challenge: most modern ATS use React/Vue/Angular to manage form state.
 * Simply setting `element.value = "..."` won't trigger React's synthetic event
 * system—the component won't detect the change, the state won't update, and
 * the form will appear empty on submission.
 *
 * Solution: We use the browser's native property descriptor setter (bypasses
 * React's override) and then dispatch native DOM events so that React's event
 * listeners pick up the change through event bubbling.
 */

/**
 * Fill an <input> element in a React-safe manner.
 * Works with plain HTML inputs AND React-controlled inputs.
 *
 * @param el    The target input element
 * @param value The value to write
 */
export async function fillInputReactSafe(el: HTMLInputElement, value: string): Promise<void> {
  el.focus();

  // Use the native property descriptor setter so React doesn't intercept the set
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }

  // Dispatch events to trigger React/Angular/Vue listeners
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

  el.blur();

  // Small delay so the React render cycle can process the change
  await sleep(50);
}

/**
 * Fill a <textarea> element in a React-safe manner.
 *
 * @param el    The target textarea element
 * @param value The value to write
 */
export async function fillTextarea(el: HTMLTextAreaElement, value: string): Promise<void> {
  el.focus();

  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  el.blur();
  await sleep(50);
}

/**
 * Fill a <select> element by matching `value` against option text or option values.
 * Tries an exact match first, then a case-insensitive partial match.
 *
 * @param el    The target select element
 * @param value The desired selection (matched against option labels AND values)
 */
export async function fillSelectByValue(el: HTMLSelectElement, value: string): Promise<void> {
  const valueNorm = value.toLowerCase().trim();

  // Try exact match against option value attribute
  for (const option of Array.from(el.options)) {
    if (option.value.toLowerCase() === valueNorm || option.text.toLowerCase() === valueNorm) {
      el.value = option.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(50);
      return;
    }
  }

  // Try partial match (e.g., "Bachelor's" matches "Bachelor's Degree")
  for (const option of Array.from(el.options)) {
    if (option.text.toLowerCase().includes(valueNorm) || valueNorm.includes(option.text.toLowerCase())) {
      el.value = option.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(50);
      return;
    }
  }
}

/**
 * Click a radio button or checkbox whose associated label matches `value`.
 *
 * @param container  The parent element containing the radio/checkbox group
 * @param value      The label text to match
 */
export async function clickRadioByLabel(container: HTMLElement, value: string): Promise<void> {
  const valueNorm = value.toLowerCase().trim();
  const labels = Array.from(container.querySelectorAll<HTMLElement>('label'));

  for (const label of labels) {
    if ((label.innerText ?? label.textContent ?? '').toLowerCase().includes(valueNorm)) {
      const inputId = label.getAttribute('for');
      const input = inputId
        ? document.getElementById(inputId) as HTMLInputElement
        : label.querySelector<HTMLInputElement>('input');
      if (input) {
        input.click();
        await sleep(50);
        return;
      }
    }
  }
}

/** Small promise-based delay */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
