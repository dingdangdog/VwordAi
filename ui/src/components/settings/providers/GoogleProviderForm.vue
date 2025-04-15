<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Google Cloud TTS Configuration
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      Configure Google Cloud Text-to-Speech service. You'll need a Google Cloud account with the TTS API enabled.
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div>
        <label for="credentials" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Service Account Key (JSON)<span class="text-red-500">*</span>
        </label>
        <textarea
          id="credentials"
          v-model="form.credentials"
          class="input w-full h-48 font-mono text-sm"
          placeholder='Paste your Google Cloud service account key JSON here'
          required
        ></textarea>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Paste your service account key JSON. Make sure it has the Cloud TTS API permissions.
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
          placeholder="e.g., https://texttospeech.googleapis.com"
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
import { serviceProviderApi } from "@/utils/api";
import { useSettingsStore } from "@/stores/settings";

const props = defineProps({
  provider: {
    type: Object,
    default: () => ({
      credentials: "",
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
  credentials: "",
  endpoint: "",
});

// Watch for prop changes and update form data
watchEffect(() => {
  if (props.provider) {
    const config = props.provider.config || {};
    form.credentials = config.credentials || "";
    form.endpoint = config.endpoint || "";
  }
});

// Validate JSON format
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Save form
async function saveForm() {
  if (!form.credentials) {
    toast.error("Please provide your Google Cloud service account key");
    return;
  }

  if (!isValidJSON(form.credentials)) {
    toast.error("The service account key must be valid JSON");
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      credentials: form.credentials,
      endpoint: form.endpoint,
    };

    const response = await serviceProviderApi.update("google", data);

    if (response.success) {
      await settingsStore.loadServiceProviders();
      toast.success("Google Cloud TTS configuration saved");
      emit("save", response.data);
    } else {
      toast.error("Save failed: " + response.error);
    }
  } catch (error) {
    console.error("Failed to save Google Cloud TTS configuration:", error);
    toast.error(
      "Save failed: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}

// Test connection
async function testConnection() {
  if (!form.credentials) {
    toast.error("Please provide your Google Cloud service account key");
    return;
  }

  if (!isValidJSON(form.credentials)) {
    toast.error("The service account key must be valid JSON");
    return;
  }

  isTesting.value = true;
  testResult.value = null;

  try {
    const response = await serviceProviderApi.testConnection("google");

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