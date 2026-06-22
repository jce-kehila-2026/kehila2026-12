import MuiTextField from '@mui/material/TextField';

/**
 * MUI TextField that auto-detects the direction of its own content.
 *
 * CMS fields hold free text that may be Hebrew or English regardless of the
 * admin UI language, so each field should align itself to what was typed
 * (Hebrew → right-aligned/RTL, English → left-aligned/LTR). `dir="auto"` on the
 * underlying input lets the browser resolve direction + alignment from the first
 * strong character of the value — independent of the page's translation.
 *
 * Drop-in replacement: same props as MUI TextField. MUI v9 removed the legacy
 * `inputProps` API in favour of `slotProps.htmlInput`, so we forward any
 * incoming `inputProps` (e.g. `maxLength`) into the correct slot and merge our
 * `dir: 'auto'` alongside it.
 */
export default function AutoDirTextField({ inputProps, slotProps, ...props }) {
  return (
    <MuiTextField
      {...props}
      slotProps={{
        ...slotProps,
        htmlInput: {
          dir: 'auto',
          ...inputProps,
          ...slotProps?.htmlInput,
        },
      }}
    />
  );
}
