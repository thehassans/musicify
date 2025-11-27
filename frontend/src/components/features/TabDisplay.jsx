import React from 'react';
import { Card } from '../ui/Card';

export function TabDisplay({ tabs }) {
    if (!tabs) return null;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Full Tab</h3>
                <Card className="bg-surface-light/50 overflow-x-auto">
                    <pre className="font-mono text-sm text-accent leading-relaxed">
                        {tabs.allStrings.join('\n')}
                    </pre>
                </Card>
            </div>

            {tabs.singleStringOptions && (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Single String Options</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {tabs.singleStringOptions.map((option, idx) => (
                            <Card key={idx} className="bg-surface-light/30">
                                <div className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {option.string}
                                </div>
                                <pre className="font-mono text-xs text-secondary overflow-x-auto">
                                    {option.tab}
                                </pre>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
