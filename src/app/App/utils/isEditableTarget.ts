const SPACE_CONTROL_TARGET_ROLE_PATTERN =
  /^(button|checkbox|menuitem(?:checkbox|radio)?|option|radio|switch|tab|treeitem)$/;

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName;
  return Boolean(
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable,
  );
}

export function isFocusableControlTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName;
  if (tagName === 'BUTTON' || tagName === 'SUMMARY') {
    return true;
  }

  if (tagName === 'A') {
    return target.hasAttribute('href');
  }

  const role = target.getAttribute('role');
  return role ? SPACE_CONTROL_TARGET_ROLE_PATTERN.test(role) : false;
}
