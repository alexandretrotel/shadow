import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomSchema, RoomFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "motion/react";
import { generateKey } from "@/lib/utils";
import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

interface JoinRoomProps {
  onJoin: (data: RoomFormData) => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomName: "",
      password: "",
      username: "",
    },
  });

  const onSubmit = (data: RoomFormData) => {
    onJoin(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full px-4"
    >
      <Card className="mx-auto mt-10 max-w-md border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-secondary-foreground text-lg tracking-wide">
            Join a Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="roomName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Room Name"
                        {...field}
                        className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Secret Key"
                              {...field}
                              className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="text-muted-foreground hover:text-accent-foreground absolute inset-y-0 right-2 flex items-center"
                            >
                              {showPassword ? (
                                <AiOutlineEyeInvisible size={20} />
                              ) : (
                                <AiOutlineEye size={20} />
                              )}
                            </button>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              field.onChange(generateKey());
                            }}
                            className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            Generate Key
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Alias"
                        {...field}
                        className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground w-full"
                >
                  Enter the Shadows
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
