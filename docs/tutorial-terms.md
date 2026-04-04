# Tutorial Terms Reference

Definitions for UI/tutorial terminology used in MRT Guessr.

## Highlighting

**Highlighting** is used **only in the tutorial**.

It means:
- place a **grey veil** over the screen
- leave a **non-grey window / cutout** over the element being focused on
- the position of that window should be determined from the **actual coordinates / bounds of the component or element being highlighted**

### Coupling rule
- if there is **highlighting**, there must be a **grey veil**
- if there is **no highlighting**, there should be **no grey veil**

### Important clarification
When Darren says **highlight**:
- it does **not** mean using a red circle
- it does **not** mean a pulse ring
- it specifically means a **greyed-out screen with a clear window around the target element**

## Tutorial info card placement
When a tutorial card is tied to a highlighted element:
- position the card relative to that same element
- prefer anchoring it near the highlighted element instead of using a generic fixed position

## Map station tutorial behavior
If the highlighted target is a map station:
- use the station's real on-screen position / bounds
- the highlight window should track the station correctly if the map is panned or transformed

## Boundary
For the home MRT background:
- **Boundary** means an invisible larger box that the moving MRT map image lives inside
- the **boundary does not crop or define the image itself**
- the MRT map image moves within this boundary
- when the image edges touch the boundary edges, it bounces
- the image can start at a random location **inside** that boundary
