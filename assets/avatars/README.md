# PMOG avatar collection

Export your models from VRoid Studio as self-contained `.vrm` files. To try the poses privately, open **Creations → Avatar Gallery → Preview local models**. Preview files stay in your browser.

## Update the gallery

Place the models you want in the gallery directly in `assets/avatars/`. In Windows PowerShell, open that folder and run:

```powershell
.\update-catalog.cmd
```

The Windows command uses built-in Windows PowerShell. If you already use Node.js, the existing `node update-catalog.mjs` command also works from this folder.

Run the command again whenever you add, rename, or remove a model. It updates the local `catalog.json`. Existing models keep their display names and order. New models appear at the end in filename order, and removed files drop out of the list.

The gallery opens the first model by default. To change the default, move its entry to the top of `catalog.json`. To change a label, edit its `name` field. The next run keeps both edits.
