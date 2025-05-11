<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Elevenlabs Configuration
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      Configure Elevenlabs Text-to-Speech service. You'll need an Elevenlabs API key.
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div>
        <label for="api_key" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Key<span class="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="api_key"
          v-model="form.api_key"
          class="input w-full"
          placeholder="Enter your Elevenlabs API key"
          required
        />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          You can find your API key in the Elevenlabs dashboard.
        </p>
      </div>

      <div>
        <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Default Model
        </label>
        <select
          id="model"
          v-model="form.model"
          class="input w-full"
        >
          <option value="eleven_monolingual_v1">Eleven Monolingual v1</option>
          <option value="eleven_multilingual_v1">Eleven Multilingual v1</option>
          <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
          <option value="eleven_turbo_v2">Eleven Turbo v2</option>
        </select>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select the default Elevenlabs model to use.
        </p>
      </div>

      <div>
        <label for="endpoint" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Custom Endpoint (Optional)
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="form.endpoint"
          class="input w-full"
          placeholder="e.g., https://api.elevenlabs.io"
        />
      </div>

      <div class="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="testConnection"
          :disabled="isTesting"
        >
          {{ isTesting ? "Testing..." : "Test Connection" }}
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          {{ isSaving ? "Saving..." : "Save Configuration" }}
        </button>
      </div>
    </form>

    <div
      v-if="testResult"
      class="mt-4 p-3 rounded-md"
      :class="
        testResult.success
          ? 'bg-green-50 dark:bg-green-900/20'
          : 'bg-red-50 dark:bg-red-900/20'
      "
    >
      <p
        :class="
          testResult.success
            ? 'text-green-700 dark:text-green-400'
            : 'text-red-700 dark:text-red-400'
        "
      >
        {{ testResult.message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { useToast } from "vue-toastification";
import { serviceProviderApi } from "@/api";
import { useSettingsStore } from "@/stores/settings";

const props = defineProps({
  provider: {
    type: Object,
    default: () => ({
      api_key: "",
      model: "eleven_multilingual_v2",
      endpoint: "",
    }),
  },
});

const emit = defineEmits(["save", "cancel", "test"]);

const toast = useToast();
const settingsStore = useSettingsStore();
const isSaving = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

// Form data
const form = reactive({
  api_key: "",
  model: "eleven_multilingual_v2",
  endpoint: "",
});

// Watch for prop changes and update form data
watchEffect(() => {
  if (props.provider) {
    const config = props.provider.config || {};
    form.api_key = config.api_key || "";
    form.model = config.model || "eleven_multilingual_v2";
    form.endpoint = config.endpoint || "";
  }
});

// Save form
async function saveForm() {
  if (!form.api_key) {
    toast.error("Please provide your Elevenlabs API key");
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      api_key: form.api_key,
      model: form.model,
      endpoint: form.endpoint,
    };

    const response = await serviceProviderApi.update("elevenlabs", data);

    if (response.success) {
      
      toast.success("Elevenlabs configuration saved");
      emit("save", response.data);
    } else {
      toast.error("Save failed: " + response.error);
    }
  } catch (error) {
    console.error("Failed to save Elevenlabs configuration:", error);
    toast.error(
      "Save failed: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}

// Test connection
async function testConnection() {
  if (!form.api_key) {
    toast.error("Please provide your Elevenlabs API key");
    return;
  }

  isTesting.value = true;
  testResult.value = null;

  try {
    const response = await serviceProviderApi.testConnection("elevenlabs");

    if (response.success) {
      testResult.value = {
        success: true,
        message: "Connection test successful",
      };
    } else {
      testResult.value = {
        success: false,
        message: response.error || "Connection test failed, please check your configuration",
      };
    }

    emit("test", testResult.value);
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : "Connection test error",
    };
    emit("test", testResult.value);
  } finally {
    isTesting.value = false;
  }
}
</script> 