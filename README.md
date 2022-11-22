# rsc-test-helper

## Motivation

I've been messing around with [Next JS's appDir beta](https://beta.nextjs.org/docs/getting-started) lately on [orbt](https://github.com/tsanga/orbt) and wanted to write some basic unit tests for some of our components. The beta utilizes RSC (async/await in server components), but you get a TS error any time you try to use an async server component in JSX (as the return type of the component is now a promise and no longer an element). NextJS knows how to handle the server components, so you're safe to just suppress the typescript error:

```jsx
<Suspense fallback={<Skeleton />}>
  {/* @ts-expect-error Server Component */}
  <RoomChatParticipants />
</Suspense>
```

In tests though, this fails, as react test renderer `create` (and testing-library/react's `render`) will error out because they don't expect the component type to be an async function. I wrote this super dirty helper so that, until official support is added, I can still write some basic unit tests for pages that utilize async/await server components.

## Usage

First, install it:  
`yarn add rsc-test-helper`

Then import the patch function:  
`import { patch } from "rsc-test-helper";`

Here's a basic example of like a that you would expect to work but doesn't:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import RoomPage from "./page";

describe("Room Page", () => {
  it("renders chat box", () => {
    render(<RoomPage />);

    const chatBox = screen.getByTestId("chat-box");

    expect(chatBox).toBeInTheDocument();
  });
});
```

`RoomPage` doesn't utilize async/await directly, but it renders a child component that does:

```jsx
export default function RoomPage() {
  return (
    ..
      <section className={styles.rightSection}>
        <RoomChatBox subheading={"Hello"} />
        <Suspense fallback={<Skeleton />}>
          {/* @ts-expect-error Server Component */}
          <RoomChatParticipants />
        </Suspense>
    ...
  );
```

Running the above test leads to this error:

```console
 FAIL  src/app/room/page.test.tsx
  Room Page
    ✕ renders chat box (50 ms)

  ● Room Page › renders chat box

    Objects are not valid as a React child (found: [object Promise]). If you meant to render a collection of children, use an array instead.
```

Plugging in the helper, we get a test that actually completes:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import RoomPage from "./page";
import { patch } from "rsc-test-helper";

describe("Room Page", () => {
  it("renders chat box", async () => {
    const Component = await patch(<RoomPage />);
    render(<Component />);

    const chatBox = screen.getByTestId("chat-box");

    expect(chatBox).toBeInTheDocument();
  });
});
```

```console

 PASS  src/app/room/page.test.tsx
  Room Page
    ✓ renders chat box (542 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

## How it works

Traverses the tree and searches for `ReactElement`'s with an async function type, if so, it awaits the promise, and replaces the async function in the original `ReactElement` with a sync function that just immediately returns the `JSX.Element` from the promise.

## Caveats

There's no way to test the fallback state of `<Suspense>`, as the helper will await the promise (client-side fetching isn't yet official supported in the beta yet, so I introduced a 0.5s delay in the `RoomChatParticipants` component, which is why the test takes 500ms+ to run).

I haven't tested it a ton yet, code is pretty janky so I'm sure there are a lot of cases that aren't covered yet. I'll probably discover some cases as I continue to test out the beta, and update this helper if viable.
