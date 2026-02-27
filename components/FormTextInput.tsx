import { Control, Controller, FieldValues, Path } from "react-hook-form";
import CustomInput, { CustomInputProps } from "./CustomInput";

interface FormTextInputProps<T extends FieldValues> extends Omit<
  CustomInputProps,
  "value" | "onChangeText"
> {
  control: Control<T>;
  name: Path<T>;
}

export const FormTextInput = <T extends FieldValues>({
  control,
  name,
  label,
  modal,

  ...textInputProps
}: FormTextInputProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <CustomInput
          label={label}
          value={value ?? ""}
          modal={modal}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...textInputProps}
        />
      )}
    />
  );
};

export default FormTextInput;
