import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PortfolioDashboard } from '../components/Portfolio/PortfolioDashboard';
import { PortfolioEditor } from '../components/Portfolio/PortfolioEditor';
import { generatePortfolio } from '../services/portfolioService';
import { PortfolioData } from '../types/portfolio';

const PortfolioBuilderPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [activePortfolio, setActivePortfolio] = useState<PortfolioData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async (prompt: string) => {
        console.log('[PortfolioBuilder] Generate started with prompt:', prompt);
        setIsGenerating(true);

        try {
            console.log('[PortfolioBuilder] Calling generatePortfolio...');
            if (!currentUser) throw new Error("You must be logged in to generate a portfolio.");
            const data = await generatePortfolio(currentUser.uid, prompt);
            console.log('[PortfolioBuilder] Generated data:', data);

            setActivePortfolio(data);
            console.log('[PortfolioBuilder] Active portfolio set');
        } catch (error) {
            console.error('[PortfolioBuilder] Generation error:', error);

            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error occurred';

            alert(`AI Generation failed: ${errorMessage}\n\nPlease check the console for details.`);
        } finally {
            setIsGenerating(false);
            console.log('[PortfolioBuilder] Generate finished, isGenerating:', false);
        }
    };

    return (
        <div className="h-screen bg-[#09090b] text-white overflow-hidden font-sans">
            {activePortfolio ? (
                <PortfolioEditor
                    initialData={activePortfolio}
                    onBack={() => setActivePortfolio(null)}
                />
            ) : (
                <PortfolioDashboard
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                />
            )}
        </div>
    );
};

export default PortfolioBuilderPage;
