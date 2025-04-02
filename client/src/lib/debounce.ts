import { debounce } from "lodash";
import { toast } from "sonner";

export const debouncedToastSuccess = debounce(
  (message: string) => toast.success(message),
  1000,
  { leading: true, trailing: false },
);

export const debouncedToastWarn = debounce(
  (message: string) => toast.warning(message),
  1000,
  { leading: true, trailing: false },
);

export const debouncedToastError = debounce(
  (message: string) => toast.error(message),
  1000,
  { leading: true, trailing: false },
);
