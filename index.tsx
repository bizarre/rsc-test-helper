import React from "react";

const _patch = async (component: any): Promise<JSX.Element> => {
  let children;
  let resolved;

  if (typeof component.type === "function") {
    const type = component.type;
    const res = await Promise.resolve(type({ ...component.props }));
    const patched = await _patch(res);
    const func = () => patched;
    Object.defineProperty(func, "name", { value: type.name });
    resolved = { ...component, type: func };
  } else {
    children = component.props?.children;
    resolved = component;
  }

  if (children) {
    if (Array.isArray(children)) {
      let temp_children = [...children];
      for (let i = 0; i < temp_children.length; i++) {
        temp_children[i] = await _patch(children[i]);
      }
      resolved = {
        ...resolved,
        props: { ...resolved.props, children: temp_children },
      };
    } else {
      resolved = {
        ...resolved,
        props: { ...resolved.props, children: await _patch(children) },
      };
    }
  }

  return resolved;
};

const patch = async <T extends JSX.Element>(
  component: Promise<T> | T,
  _props: object = {}
): Promise<React.FunctionComponent> => {
  const built = await _patch(component);

  return () => <>{built}</>;
};

export { patch };
