import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '../hooks/useMembers';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';

export function AddMember() {
  const { addMember } = useMembers();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) return;

    setSaving(true);

    let planName = undefined;
    let planDurationMonths = undefined;

    if (plan === '1M') { planName = '1 Month Plan'; planDurationMonths = 1; }
    if (plan === '3M') { planName = '3 Month Plan'; planDurationMonths = 3; }
    if (plan === '12M') { planName = 'Annual Plan'; planDurationMonths = 12; }

    await addMember({ 
      fullName: fullName.trim(), 
      phone: phone.trim(),
      planName,
      planDurationMonths
    });

    setSaving(false);
    navigate('/members');
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-4">Add New Member</h2>

      <div className="max-w-md">
        <div className="bg-surface border border-border-subtle rounded-lg p-5">
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="Rahul Sharma"
              required
              id="member-name"
            />
            <TextInput
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="9876543210"
              required
              id="member-phone"
            />

            <div className="mt-3">
              <label className="block text-sm font-medium text-text-muted mb-1.5">Assign Plan</label>
              <select 
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              >
                <option value="">No Plan (Guest)</option>
                <option value="1M">1 Month Plan</option>
                <option value="3M">3 Month Plan</option>
                <option value="12M">Annual Plan</option>
              </select>
            </div>

            <div className="flex gap-3 mt-5">
              <PrimaryButton type="submit" loading={saving}>
                Add Member
              </PrimaryButton>
              <PrimaryButton
                variant="secondary"
                onClick={() => navigate('/members')}
              >
                Cancel
              </PrimaryButton>
            </div>
          </form>
        </div>

        <p className="text-xs text-text-muted mt-2">
          Saved locally. Syncs when online.
        </p>
      </div>
    </div>
  );
}
