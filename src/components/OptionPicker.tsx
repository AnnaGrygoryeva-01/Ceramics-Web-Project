import type { ProductOptions } from "@/lib/products";
import Dropdown from "./Dropdown";

type Props = {
  options: ProductOptions;
  choices: string[];
  stockLeft: (slug: string) => number; // After what's in the cart
  onChange: (choices: string[]) => void;
};

export default function OptionPicker({ options, choices, stockLeft, onChange }: Props) {
  return (
    <div className="option-picker">
      {choices.map((choice, index) => (
        <Dropdown
          key={index}
          className="option-picker__pick"
          label={`${options.label} ${index + 1}`}
          value={choice}
          onChange={(value) => onChange(choices.with(index, value))}
          options={Object.keys(options.values).map((value) => {
            // Not enough of that brush left for these picks (after what's in the cart)
            const picks = choices.with(index, value);
            const tooMany = picks.filter((p) => p === value).length > stockLeft(options.values[value]);
            return { value, label: value, disabled: value !== choice && tooMany };
          })}
        />
      ))}
    </div>
  );
}
