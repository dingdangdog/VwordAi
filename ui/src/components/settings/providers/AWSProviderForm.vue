<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      AWS Polly TTS Configuration
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      Configure AWS Polly for text-to-speech services. Ensure you have an AWS
      account with Polly enabled.
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div>
        <label
          for="accessKey"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Access Key ID<span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="accessKey"
          v-model="form.accessKey"
          class="input w-full"
          placeholder="Enter your AWS Access Key ID"
          required
        />
      </div>

      <div>
        <label
          for="secretKey"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Secret Access Key<span class="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="secretKey"
          v-model="form.secretKey"
          class="input w-full"
          placeholder="Enter your AWS Secret Access Key"
          required
        />
      </div>

      <div>
        <label
          for="region"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Region<span class="text-red-500">*</span>
        </label>
        <select id="region" v-model="form.region" class="input w-full" required>
          <option value="" disabled>Select a region</option>
          <option
            v-for="region in awsRegions"
            :key="region.value"
            :value="region.value"
          >
            {{ region.name }}
          </option>
        </select>
      </div>

      <div>
        <label
          for="endpoint"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Custom Endpoint (Optional)
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="form.endpoint"
          class="input w-full"
          placeholder="e.g., https://polly.us-west-2.amazonaws.com"
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
      endpoint: "",
      accessKey: "",
      secretKey: "",
      region: "",
    }),
  },
});

const emit = defineEmits(["save", "cancel", "test"]);

const toast = useToast();
const settingsStore = useSettingsStore();
const isSaving = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

// AWS Regions
const awsRegions = [
  { value: "us-east-1", name: "US East (N. Virginia)" },
  { value: "us-east-2", name: "US East (Ohio)" },
  { value: "us-west-1", name: "US West (N. California)" },
  { value: "us-west-2", name: "US West (Oregon)" },
  { value: "ca-central-1", name: "Canada (Central)" },
  { value: "eu-west-1", name: "EU (Ireland)" },
  { value: "eu-west-2", name: "EU (London)" },
  { value: "eu-west-3", name: "EU (Paris)" },
  { value: "eu-central-1", name: "EU (Frankfurt)" },
  { value: "eu-north-1", name: "EU (Stockholm)" },
  { value: "ap-northeast-1", name: "Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", name: "Asia Pacific (Seoul)" },
  { value: "ap-southeast-1", name: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", name: "Asia Pacific (Sydney)" },
  { value: "ap-south-1", name: "Asia Pacific (Mumbai)" },
  { value: "sa-east-1", name: "South America (São Paulo)" },
];

// Form data
const form = reactive({
  accessKey: "",
  secretKey: "",
  region: "",
  endpoint: "",
});

// Watch for prop changes and update form data
watchEffect(() => {
  if (props.provider) {
    const config = props.provider.config || {};
    form.accessKey = config.accessKey || "";
    form.secretKey = config.secretKey || "";
    form.region = config.region || "";
    form.endpoint = config.endpoint || "";
  }
});

// Save form
async function saveForm() {
  if (!form.accessKey || !form.secretKey || !form.region) {
    toast.error("Please fill in all required fields");
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      accessKey: form.accessKey,
      secretKey: form.secretKey,
      region: form.region,
      endpoint: form.endpoint,
    };

    const response = await serviceProviderApi.update("aws", data);

    if (response.success) {
      toast.success("AWS Polly configuration saved");
      emit("save", response.data);
    } else {
      toast.error("Save failed: " + response.error);
    }
  } catch (error) {
    console.error("Failed to save AWS Polly configuration:", error);
    toast.error(
      "Save failed: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}

// Test connection
async function testConnection() {
  if (!form.accessKey || !form.secretKey || !form.region) {
    toast.error("Please fill in all required fields first");
    return;
  }

  isTesting.value = true;
  testResult.value = null;

  try {
    const response = await serviceProviderApi.testConnection("aws");

    if (response.success) {
      testResult.value = {
        success: true,
        message: "Connection test successful",
      };
    } else {
      testResult.value = {
        success: false,
        message:
          response.error ||
          "Connection test failed, please check your configuration",
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
