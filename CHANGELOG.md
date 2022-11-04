# Change log

This file contains notable changes to the project

## 0.2.0

**features**

- Added `RoomNotFoundError` which can be thrown during `onConnection`, `onClose` and `onMessage`.
- `NodePortalServer` now sends "error" signals to the client when passing an unknown room.
  This occurs during connection, per-message or on close.
- Added `handleTravellerError` to `PortalServer` to handle common errors or emit them if not handled.

**fixes**

- `NodePortalServer` no longer crashes during `onClose` when called with an unknown room.
- Tweak `DescriptionSignal` and `CandidateSignal` to be more accurate.

**docs**

- Added info on the signals that the client and server send eachother.

## 0.1.1

**fixes**

- link up TypeScript "types" exports

## 0.1.0

🎉 Everything is new
