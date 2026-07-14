import { useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import MuiTextField from '@mui/material/TextField';
import ISRAELI_CITIES from '../data/israeliCities.json';

/**
 * Searchable single-select for an Israeli city/locality.
 *
 * Replaces free-text location fields so a value can only be chosen from the
 * official localities list (bundled in ../data/israeliCities.json — objects of
 * { he, en } — refreshed via scripts/fetch-israeli-cities.mjs). The list is large
 * (~1,300 entries) so this uses an Autocomplete (type-to-filter) and is
 * searchable in both Hebrew and English ("jer" → ירושלים / Jerusalem).
 *
 * The stored value is the Hebrew name (string), so it stays compatible with
 * existing data and the rest of the app. Any saved value not in the list (legacy
 * free text) is still shown and kept, so converting these fields doesn't wipe it.
 */
function optionLabel(option) {
  if (!option) return '';
  if (typeof option === 'string') return option;
  return option.en ? `${option.he} (${option.en})` : option.he;
}

export default function CitySelect({
  value = '',
  onChange,
  label,
  placeholder,
  required = false,
  error = false,
  helperText,
  fullWidth = true,
  disabled = false,
  id,
  name,
  size,
  className,
  textFieldProps = {},
}) {
  const selectedOption = useMemo(() => {
    const trimmed = (value || '').trim();
    if (!trimmed) return null;
    return ISRAELI_CITIES.find((city) => city.he === trimmed) || { he: trimmed, en: '' };
  }, [value]);

  const options = useMemo(() => {
    const trimmed = (value || '').trim();
    if (trimmed && !ISRAELI_CITIES.some((city) => city.he === trimmed)) {
      return [{ he: trimmed, en: '' }, ...ISRAELI_CITIES];
    }
    return ISRAELI_CITIES;
  }, [value]);

  return (
    <Autocomplete
      className={className}
      options={options}
      value={selectedOption}
      onChange={(_event, next) => onChange?.(next ? next.he : '')}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(option, val) => option.he === val.he}
      autoHighlight
      selectOnFocus
      handleHomeEndKeys
      disabled={disabled}
      fullWidth={fullWidth}
      id={id}
      size={size}
      // These fields live inside custom modals (z-index up to 10000); keep the
      // dropdown popup above them so the list is always visible.
      slotProps={{ popper: { sx: { zIndex: 100000 } } }}
      // Show the whole list when the field is opened (empty input, or the input
      // still equals the current selection — including a legacy non-city value);
      // only filter once the user types. Matches both Hebrew and English names.
      filterOptions={(opts, state) => {
        const typed = state.inputValue.trim().toLowerCase();
        const current = optionLabel(selectedOption).toLowerCase();
        if (!typed || typed === current) return opts;
        return opts.filter((option) => {
          const he = option.he.toLowerCase();
          const en = (option.en || '').toLowerCase();
          return he.includes(typed) || en.includes(typed);
        });
      }}
      renderInput={(params) => (
        <MuiTextField
          {...params}
          name={name}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          {...textFieldProps}
          inputProps={{ ...params.inputProps, ...textFieldProps.inputProps }}
        />
      )}
    />
  );
}
