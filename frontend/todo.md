# GüneşOS - İşletim Sistemi Simülasyonu v2

## Design
- **Color Palette**: 
  - Desktop bg: wallpaper image
  - Taskbar: #c0c0c0 (silver/gray, clean retro style)
  - Window title bar: #000080 (navy blue)
  - Start button: retro gray (NO green)
  - Accent: #0078d4
- **Typography**: "Segoe UI", system-ui, sans-serif
- **Responsive**: PC / Tablet / Phone layouts

## Development Tasks
- [x] Create BootScreen component
- [x] Create Desktop component
- [x] Create Taskbar component
- [x] Create Window manager
- [x] Create Notepad app
- [x] Create Terminal app
- [x] Create Minesweeper game
- [x] Create Browser app
- [x] Wire everything together
- [x] Update Index.tsx
- [ ] Fix Taskbar: remove green start, clean design
- [ ] Browser: ega:// protocol, search bar, domain purchase
- [ ] Responsive: tablet/phone layouts with adapted menus
- [ ] Desktop: drag icons, auto-align, right-click "yeni belge", new folder (localStorage)
- [ ] Kids game app (5 brain games, closes at 21:00)
- [ ] Notepad: save to file explorer (localStorage)
- [ ] Terminal: enhanced commands (kapat, ekle, etc.)
- [ ] Settings app for tablet/phone

## Files
1. `src/components/GunesOS.tsx` - Main OS + window manager + responsive
2. `src/components/BootScreen.tsx` - Boot screen
3. `src/components/Desktop.tsx` - Desktop with drag, align, right-click, folders
4. `src/components/Taskbar.tsx` - Clean taskbar, responsive
5. `src/components/WindowFrame.tsx` - Draggable/resizable window
6. `src/components/apps/Notepad.tsx` - Notepad with save
7. `src/components/apps/Terminal.tsx` - Enhanced terminal
8. `src/components/apps/Browser.tsx` - ega:// protocol, search, domain purchase