const SPACE_CONTROL_TARGET_ROLES = new Set([
  'button',
  'checkbox',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'switch',
  'tab',
  'treeitem',
]);

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable,
  );
}

export function isFocusableControlTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  if (
    target instanceof HTMLButtonElement ||
    target.tagName === 'SUMMARY' ||
    (target instanceof HTMLAnchorElement && target.hasAttribute('href'))
  ) {
    return true;
  }

  const role = target.getAttribute('role');
  return role ? SPACE_CONTROL_TARGET_ROLES.has(role) : false;
}
