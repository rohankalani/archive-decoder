import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmailSettings() {
  const [emailSettings, setEmailSettings] = useState<EmailSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setEmailSettings(data || []);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast.error('Failed to fetch email settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmailSetting = async (settingKey: string, settingValue: string) => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .update({ setting_value: settingValue })
        .eq('setting_key', settingKey)
        .select()
        .single();

      if (error) throw error;
      
      setEmailSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: settingValue }
          : setting
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating email setting:', error);
      throw error;
    }
  };

  const getSettingValue = (settingKey: string): string => {
    return emailSettings.find(setting => setting.setting_key === settingKey)?.setting_value || '';
  };

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  return {
    emailSettings,
    isLoading,
    updateEmailSetting,
    getSettingValue,
    refetch: fetchEmailSettings,
  };
}