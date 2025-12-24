'use client';

import TextField, { TextFieldProps } from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectProps } from '@mui/material/Select';
import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';

// FormTextField - Enhanced text field with tooltip support
interface FormTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  tooltip?: string;
}

export function FormTextField({ tooltip, label, ...props }: FormTextFieldProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        label={
          tooltip ? (
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {label}
              <Tooltip title={tooltip} arrow placement="top">
                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Tooltip>
            </Box>
          ) : (
            label
          )
        }
        {...props}
      />
    </Box>
  );
}

// FormSelect - Enhanced select field
interface FormSelectProps extends Omit<SelectProps, 'variant'> {
  label: string;
  options: Array<{ value: string | number; label: string }>;
  helperText?: string;
  tooltip?: string;
}

export function FormSelect({
  label,
  options,
  helperText,
  tooltip,
  ...props
}: FormSelectProps) {
  return (
    <FormControl fullWidth>
      <InputLabel>
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {label}
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          )}
        </Box>
      </InputLabel>
      <Select label={label} {...props}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

// FormCheckbox - Enhanced checkbox field
interface FormCheckboxProps extends CheckboxProps {
  label: string;
  helperText?: string;
}

export function FormCheckbox({ label, helperText, ...props }: FormCheckboxProps) {
  return (
    <FormControl>
      <FormControlLabel control={<Checkbox {...props} />} label={label} />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

