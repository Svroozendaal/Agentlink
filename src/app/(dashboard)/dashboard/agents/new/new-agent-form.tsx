"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { PricingModel } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CreateAgentSchema } from "@/lib/validations/agent";

const CreateAgentFormSchema = CreateAgentSchema.pick({
  name: true,
  description: true,
  longDescription: true,
  skills: true,
  protocols: true,
  endpointUrl: true,
  pricingModel: true,
  websiteUrl: true,
  acceptsMessages: true,
  playgroundEnabled: true,
  connectEnabled: true,
}).extend({
  isPublished: z.boolean().default(true),
});

type CreateAgentFormInput = z.input<typeof CreateAgentFormSchema>;
type CreateAgentFormOutput = z.output<typeof CreateAgentFormSchema>;

const protocolOptions = ["a2a", "rest", "mcp"] as const;

interface NewAgentFormProps {
  canPublishImmediately: boolean;
}

export function NewAgentForm({ canPublishImmediately }: NewAgentFormProps) {
  const router = useRouter();
  const [skillInput, setSkillInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [currentProtocols, setCurrentProtocols] = useState<(typeof protocolOptions)[number][]>([
    "rest",
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAgentFormInput, unknown, CreateAgentFormOutput>({
    resolver: zodResolver(CreateAgentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      longDescription: "",
      skills: [],
      protocols: ["rest"],
      endpointUrl: "",
      pricingModel: PricingModel.FREE,
      websiteUrl: "",
      acceptsMessages: true,
      playgroundEnabled: false,
      connectEnabled: false,
      isPublished: canPublishImmediately,
    },
  });

  function addSkill() {
    const trimmed = skillInput.trim();

    if (!trimmed) {
      return;
    }

    if (!currentSkills.includes(trimmed)) {
      const nextSkills = [...currentSkills, trimmed];
      setCurrentSkills(nextSkills);
      setValue("skills", nextSkills, { shouldValidate: true });
    }

    setSkillInput("");
  }

  function removeSkill(skill: string) {
    const nextSkills = currentSkills.filter((value) => value !== skill);
    setCurrentSkills(nextSkills);
    setValue(
      "skills",
      nextSkills,
      { shouldValidate: true },
    );
  }

  function toggleProtocol(protocol: (typeof protocolOptions)[number]) {
    if (currentProtocols.includes(protocol)) {
      const nextProtocols = currentProtocols.filter((value) => value !== protocol);
      setCurrentProtocols(nextProtocols);
      setValue(
        "protocols",
        nextProtocols,
        { shouldValidate: true },
      );
      return;
    }

    const nextProtocols = [...currentProtocols, protocol];
    setCurrentProtocols(nextProtocols);
    setValue("protocols", nextProtocols, { shouldValidate: true });
  }

  async function onSubmit(values: CreateAgentFormOutput) {
    setFormError(null);

    const response = await fetch("/api/v1/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setFormError(payload?.error?.message ?? "Something went wrong while creating the agent.");
      return;
    }

    const createdSlug: string | undefined = payload?.data?.slug;

    if (!createdSlug) {
      setFormError("Agent created, but slug was missing from the response.");
      return;
    }

    if (canPublishImmediately) {
      router.push(`/agents/${createdSlug}`);
      return;
    }

    router.push("/dashboard/agents");
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name" className="text-sm font-medium text-zinc-800">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-zinc-800">
          Short description
        </label>
        <input
          id="description"
          type="text"
          {...register("description")}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        {errors.description ? (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="longDescription" className="text-sm font-medium text-zinc-800">
          Long description
        </label>
        <textarea
          id="longDescription"
          rows={5}
          {...register("longDescription")}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        {errors.longDescription ? (
          <p className="mt-1 text-xs text-red-600">{errors.longDescription.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="skills" className="text-sm font-medium text-zinc-800">
          Skills
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="skills"
            type="text"
            value={skillInput}
            onChange={(event) => setSkillInput(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            placeholder="e.g. data-analysis"
          />
          <button
            type="button"
            onClick={addSkill}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {currentSkills.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => removeSkill(skill)}
              className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800"
            >
              {skill} x
            </button>
          ))}
        </div>
        {errors.skills ? <p className="mt-1 text-xs text-red-600">{errors.skills.message}</p> : null}
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-800">Protocols</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {protocolOptions.map((protocol) => (
            <label
              key={protocol}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700"
            >
              <input
                type="checkbox"
                checked={currentProtocols.includes(protocol)}
                onChange={() => toggleProtocol(protocol)}
                className="h-4 w-4"
              />
              {protocol.toUpperCase()}
            </label>
          ))}
        </div>
        {errors.protocols ? (
          <p className="mt-1 text-xs text-red-600">{errors.protocols.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="endpointUrl" className="text-sm font-medium text-zinc-800">
            Endpoint URL
          </label>
          <input
            id="endpointUrl"
            type="url"
            {...register("endpointUrl")}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          {errors.endpointUrl ? (
            <p className="mt-1 text-xs text-red-600">{errors.endpointUrl.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="websiteUrl" className="text-sm font-medium text-zinc-800">
            Website URL
          </label>
          <input
            id="websiteUrl"
            type="url"
            {...register("websiteUrl")}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          {errors.websiteUrl ? (
            <p className="mt-1 text-xs text-red-600">{errors.websiteUrl.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="pricingModel" className="text-sm font-medium text-zinc-800">
          Pricing model
        </label>
        <select
          id="pricingModel"
          {...register("pricingModel")}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {Object.values(PricingModel).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" {...register("acceptsMessages")} />
        This agent accepts messages
      </label>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" {...register("playgroundEnabled")} />
        Enable playground for public testing
      </label>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" {...register("connectEnabled")} />
        Enable connect API for agent-to-agent calls
      </label>

      {canPublishImmediately ? (
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" {...register("isPublished")} />
          Publish immediately after creation
        </label>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          After submission, this agent will be pending admin approval before publication.
        </p>
      )}

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : "Create agent"}
      </button>
    </form>
  );
}
