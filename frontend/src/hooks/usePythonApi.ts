// frontend/src/hooks/usePythonApi.ts
import {
    useQuery,
    useMutation,
    UseQueryResult,
    UseMutationResult,
    UseQueryOptions,
    UseMutationOptions,
  } from '@tanstack/react-query';
  import { toast } from 'sonner';
  import apiService from '../services/apiService'; // Ensure this path is correct and uses the REVISED apiService
  
  // --- Types for your Python API Endpoints (Define these based on actual backend responses) ---
  
  // Example for a backend status check endpoint
  interface PythonBackendStatus {
    status: string;
    message: string;
    // Add other relevant fields your backend might return
  }
  
  // Example for a data processing endpoint (e.g., sum calculation)
  interface DataProcessingPayload {
    numbers: number[];
    operation: string;
  }
  interface DataProcessingResponse {
    result: number;
    // Add other fields
  }
  
  // Example for a file processing endpoint
  interface FileProcessingResponse {
    message: string;
    fileId?: string; // Example
    // Add other fields
  }
  
  
  // --- Hook for fetching data (GET requests) e.g., Python Backend Status ---
  // TQueryFnData: Type of data returned by the query function
  // TError: Type of error (usually Error)
  // TData: Type of data returned by the hook (defaults to TQueryFnData)
  // TQueryKey: Type for the query key (usually (string | number)[])
  export function usePythonQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData, // TData is the type of data that will be in the `data` property.
                        // TQueryFnData is the type returned by the queryFn.
  TQueryKey extends (string | number)[] = (string | number)[]
>(
  queryKey: TQueryKey,
  endpoint: string,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  const { onSuccess: optionsOnSuccess, onError: optionsOnError, ...restOptions } = options || {};

  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey: queryKey,
    queryFn: async () => {
      const isPublicEndpoint = (restOptions as any)?.isPublic === true || (options as any)?.isPublic === true;
      return apiService.get<TQueryFnData>(endpoint, { isPublic: isPublicEndpoint });
    },
    onSuccess: (data: TQueryFnData) => { // React Query's onSuccess for queryFn's result type
      // Default success action (e.g., logging, usually not toasting for queries)
      // console.log(`Query for ${queryKey.join('/')} succeeded with data:`, data);

      // Call the onSuccess passed in options, if any.
      // Note: React Query's onSuccess here receives TQueryFnData.
      // If the hook is used with a 'select' function that transforms TQueryFnData to TData,
      // the 'data' in component's useQuery result will be TData.
      // The onSuccess callback from options should ideally expect TData if a select is used.
      // For simplicity here, assuming TData is often TQueryFnData or the user handles types in their callback.
      if (optionsOnSuccess) {
        (optionsOnSuccess as (data: TQueryFnData) => void)(data);
      }
    },
    onError: (error: TError) => {
      // apiService should have already toasted the error.
      console.error(`Query for ${queryKey.join('/')} failed in hook:`, (error as Error).message);

      // Call the onError passed in options, if any.
      if (optionsOnError) {
        optionsOnError(error);
      }
    },
    ...restOptions, // Spread the rest of the options.
  });
}

// The usePythonMutation and usePythonFileUpload from your last post are generally fine regarding onSuccess/onError,
// as the default toast happens, and then options.onSuccess/onError are called.
// Ensure the isPublic logic is passed through correctly:

export function usePythonMutation<
  TData = unknown, TError = Error, TVariables = void, TContext = unknown
>(
  endpoint: string, httpMethod: 'POST' | 'PUT' = 'POST',
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { onSuccess: optionsOnSuccess, onError: optionsOnError, ...restOptions } = options || {};
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      const isPublicEndpoint = (restOptions as any)?.isPublic === true || (options as any)?.isPublic === true;
      if (httpMethod === 'POST') {
        return apiService.post<TData, TVariables>(endpoint, variables, { isPublic: isPublicEndpoint });
      } else {
        return apiService.put<TData, TVariables>(endpoint, variables, { isPublic: isPublicEndpoint });
      }
    },
    onSuccess: (data, variables, context) => {
      toast.success("Operation completed successfully!");
      if (optionsOnSuccess) {
        optionsOnSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error(`Mutation to ${endpoint} failed in hook:`, (error as Error).message);
      if (optionsOnError) {
        optionsOnError(error, variables, context);
      }
    },
    ...restOptions,
  });
}

export function usePythonFileUpload<
  TData = FileProcessingResponse, TError = Error, TVariables = File, TContext = unknown
>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables, TContext> {
    const { onSuccess: optionsOnSuccess, onError: optionsOnError, ...restOptions } = options || {};
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      let fileToUpload: File;
      let additionalData: Record<string, string> | undefined;
      const isPublicEndpoint = (restOptions as any)?.isPublic === true || (options as any)?.isPublic === true;

      if (variables instanceof File) {
        fileToUpload = variables;
      } else if (typeof variables === 'object' && variables !== null && 'file' in variables && (variables as any).file instanceof File) {
        fileToUpload = (variables as any).file;
        const { file, ...otherData } = variables as any;
        additionalData = {};
        for (const key in otherData) {
          if (Object.prototype.hasOwnProperty.call(otherData, key) && typeof otherData[key] === 'string') {
            additionalData[key] = otherData[key];
          }
        }
      } else {
        throw new Error("Invalid variables provided for file upload. Expected a File object or an object containing a 'file' property of type File.");
      }
      return apiService.uploadFile<TData>(endpoint, fileToUpload, additionalData, { isPublic: isPublicEndpoint });
    },
    onSuccess: (data, variables, context) => {
      toast.success("File uploaded and processed successfully!");
      if (optionsOnSuccess) {
        optionsOnSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error(`File upload to ${endpoint} failed in hook:`, (error as Error).message);
      if (optionsOnError) {
        optionsOnError(error, variables, context);
      }
    },
    ...restOptions,
  });
}


// ---- Specific Hooks built using the generic ones ----
// ... (these should be mostly fine, but let's ensure they pass isPublic through `options` to the generic hook)

export const useCheckBackendStatus = (
  options?: Omit<UseQueryOptions<PythonBackendStatus, Error, PythonBackendStatus, ['backendStatus']>, 'queryKey' | 'queryFn'> & { isPublic?: boolean } // Add isPublic here
) => {
  const { isPublic = true, ...restQueryOptions } = options || {}; // Default to public for status check
  return usePythonQuery<PythonBackendStatus, Error, PythonBackendStatus, ['backendStatus']>(
    ['backendStatus'],
    '/utils/status',
    {
      staleTime: 5 * 60 * 1000,
      isPublic: isPublic, // Pass it to the generic hook's options
      ...restQueryOptions,
    }
  );
};

export const useProcessData = (
  options?: Omit<UseMutationOptions<DataProcessingResponse, Error, DataProcessingPayload>, 'mutationFn'> & { isPublic?: boolean }
) => {
  const { isPublic = false, ...restMutationOptions } = options || {}; // Default to not public for data processing
  return usePythonMutation<DataProcessingResponse, Error, DataProcessingPayload>(
    '/utils/calculate',
    'POST',
    {
      isPublic: isPublic,
      ...restMutationOptions,
    }
  );
};

export const useProcessUploadedFile = (
  options?: Omit<UseMutationOptions<FileProcessingResponse, Error, File>, 'mutationFn'> & { isPublic?: boolean }
) => {
  const { isPublic = false, ...restMutationOptions } = options || {}; // Default to not public for file uploads
  return usePythonFileUpload<FileProcessingResponse, Error, File>(
    '/utils/process-file',
    {
      isPublic: isPublic,
      ...restMutationOptions,
    }
  );
};