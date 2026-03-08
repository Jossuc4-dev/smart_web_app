// src/pages/help/HelpScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaHome,
    FaBoxes,
    FaShoppingCart,
    FaUsers,
    FaChartLine,
    FaCheckCircle,
    FaLightbulb,
    FaSearch,
    FaBookOpen,
    FaQuestionCircle,
    FaChevronDown,
    FaChevronUp,
    FaPlay,
    FaPause,
    FaStepForward,
    FaStepBackward,
    FaTimes,
    FaChevronRight
} from 'react-icons/fa';
import { MdBusinessCenter, MdDashboard } from 'react-icons/md';
import { RiMoneyEuroCircleFill } from 'react-icons/ri';
import './index.css';

interface Section {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    points: string[];
    tip: string;
    color: string;
}

interface TutorialStep {
    title: string;
    description: string;
    image?: string;
    action?: string;
}

export default function HelpScreen() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const tutorialIntervalRef = useRef<ReturnType<typeof setInterval>>(null);

    const sections: Section[] = [
        {
            id: 'dashboard',
            icon: MdDashboard,
            title: "Tableau de bord",
            description: "L'écran principal affiche un résumé de votre activité en temps réel.",
            points: [
                "Revenus hebdomadaires : total des ventes de la semaine",
                "Ventes du jour : chiffre d'affaires réalisé aujourd'hui",
                "Produits en stock : nombre total d'articles disponibles",
                "Alertes stock : produits en rupture ou en dessous du seuil critique",
                "Commandes en cours : nombre de commandes en attente de validation",
                "Variation du CA : évolution par rapport à la période précédente"
            ],
            tip: "Utilisez le bouton de rafraîchissement en haut à droite pour mettre à jour les données en temps réel.",
            color: "#4F46E5"
        },
        {
            id: 'stock',
            icon: FaBoxes,
            title: "Gestion des stocks",
            description: "Gérez efficacement vos produits et suivez les mouvements de stock.",
            points: [
                "Ajouter un produit : cliquez sur le bouton + en haut à droite",
                "Modifier un produit : cliquez sur le produit puis sur 'Modifier'",
                "Alertes automatiques : seuil critique configurable",
                "Historique des mouvements : toutes les entrées et sorties",
                "Export PDF : générez un rapport d'inventaire"
            ],
            tip: "Activez les notifications pour être alerté immédiatement en cas de stock critique.",
            color: "#10b981"
        },
        {
            id: 'ventes',
            icon: FaShoppingCart,
            title: "Ventes et commandes",
            description: "Enregistrez vos ventes et gérez les commandes clients.",
            points: [
                "Nouvelle vente : sélectionnez un produit et un client",
                "Commandes en attente : filtrez par statut (payé/en attente/crédit)",
                "Validation de paiement : marquez une commande comme payée",
                "Génération de facture : PDF automatique pour chaque commande",
                "Sélection multiple : validez ou supprimez plusieurs commandes"
            ],
            tip: "Utilisez la recherche rapide pour retrouver un client ou un produit en quelques secondes.",
            color: "#f59e0b"
        },
        {
            id: 'rh',
            icon: FaUsers,
            title: "Ressources humaines",
            description: "Gérez vos employés, leurs postes et leurs salaires.",
            points: [
                "Ajouter un employé : formulaire complet avec toutes les informations",
                "Liste des employés : visualisez toute votre équipe",
                "Gestion des congés : suivez les absences et congés",
                "Masse salariale : calcul automatique du total des salaires",
                "Filtres : triez par rôle (admin/employé)"
            ],
            tip: "Les administrateurs ont accès à toutes les fonctionnalités RH.",
            color: "#8b5cf6"
        },
        {
            id: 'finance',
            icon: FaChartLine,
            title: "Finance et comptabilité",
            description: "Suivez la santé financière de votre entreprise.",
            points: [
                "Bilan hebdomadaire : chiffre d'affaires et variations",
                "Évolution du solde : graphique interactif",
                "Compte entreprise : dépôts et retraits",
                "Factures : historique complet",
                "Rapports PDF : exportez les bilans"
            ],
            tip: "Le solde du compte est mis à jour automatiquement après chaque vente.",
            color: "#ef4444"
        }
    ];

    // Simulation de tutoriels interactifs
    const tutorials: Record<string, TutorialStep[]> = {
        dashboard: [
            {
                title: "Vue d'ensemble",
                description: "Le tableau de bord vous donne un aperçu instantané de votre activité.",
                action: "Observez les KPI en haut de l'écran"
            },
            {
                title: "Graphique des ventes",
                description: "Le graphique montre l'évolution de votre chiffre d'affaires sur le mois.",
                action: "Passez la souris sur les points pour voir les détails"
            },
            {
                title: "Actions rapides",
                description: "Cliquez sur les cartes statistiques pour filtrer les données correspondantes.",
                action: "Essayez de cliquer sur 'Ventes du jour'"
            }
        ],
        stock: [
            {
                title: "Liste des produits",
                description: "Tous vos produits sont affichés avec leur stock actuel.",
                action: "Utilisez la barre de recherche pour trouver un produit"
            },
            {
                title: "Alertes stock",
                description: "Les produits en dessous du seuil critique sont mis en évidence.",
                action: "Vérifiez les produits en surbrillance rouge"
            },
            {
                title: "Ajout de produit",
                description: "Cliquez sur le bouton + pour ajouter un nouveau produit.",
                action: "Remplissez le formulaire avec les informations du produit"
            }
        ]
    };

    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
                setScrollProgress(progress);
            }
        };

        const currentRef = contentRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
            return () => currentRef.removeEventListener('scroll', handleScroll);
        }
    }, []);

    useEffect(() => {
        if (isPlaying && activeTutorial && tutorials[activeTutorial]) {
            tutorialIntervalRef.current = setInterval(() => {
                setTutorialStep((prev) => {
                    const next = prev + 1;
                    if (next >= tutorials[activeTutorial].length) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return next;
                });
            }, 3000);
        }

        return () => {
            if (tutorialIntervalRef.current) {
                clearInterval(tutorialIntervalRef.current);
            }
        };
    }, [isPlaying, activeTutorial]);

    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.points.some(point => point.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const startTutorial = (sectionId: string) => {
        setActiveTutorial(sectionId);
        setTutorialStep(0);
        setIsPlaying(true);
    };

    const nextTutorialStep = () => {
        if (activeTutorial && tutorials[activeTutorial]) {
            setTutorialStep((prev) =>
                prev < tutorials[activeTutorial].length - 1 ? prev + 1 : prev
            );
        }
    };

    const prevTutorialStep = () => {
        setTutorialStep((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const closeTutorial = () => {
        setActiveTutorial(null);
        setTutorialStep(0);
        setIsPlaying(false);
    };

    return (
        <div className="help-container">
            {/* Barre de progression */}
            <div
                className="scroll-progress"
                style={{ width: `${scrollProgress}%` }}
            />

            {/* Header */}
            <header className="help-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                </button>
                <h1>
                    <FaBookOpen className="header-icon" />
                    Centre d'aide
                </h1>
                <div className="header-actions">
                    <button
                        className="help-btn"
                        onClick={() => window.open('/faq', '_blank')}
                    >
                        <FaQuestionCircle />
                    </button>
                </div>
            </header>

            {/* Barre de recherche */}
            <div className="help-search">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Rechercher dans l'aide..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSearchResults(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    onFocus={() => setShowSearchResults(true)}
                />
                {searchTerm && (
                    <button
                        className="clear-search"
                        onClick={() => setSearchTerm('')}
                    >
                        <FaTimes />
                    </button>
                )}

                {/* Résultats de recherche */}
                {showSearchResults && searchTerm && (
                    <div className="search-results">
                        {filteredSections.length > 0 ? (
                            filteredSections.map(section => (
                                <button
                                    key={section.id}
                                    className="search-result-item"
                                    onClick={() => {
                                        setExpandedSection(section.id);
                                        setSearchTerm('');
                                        setShowSearchResults(false);
                                        document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    <section.icon style={{ color: section.color }} />
                                    <div>
                                        <strong>{section.title}</strong>
                                        <p>{section.description.substring(0, 60)}...</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="no-results">
                                <p>Aucun résultat trouvé</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tutoriel actif */}
            {activeTutorial && tutorials[activeTutorial] && (
                <div className="tutorial-popup">
                    <div className="tutorial-header">
                        <h3>{tutorials[activeTutorial][tutorialStep].title}</h3>
                        <button className="close-tutorial" onClick={closeTutorial}>
                            <FaTimes />
                        </button>
                    </div>
                    <p className="tutorial-description">
                        {tutorials[activeTutorial][tutorialStep].description}
                    </p>
                    {tutorials[activeTutorial][tutorialStep].action && (
                        <div className="tutorial-action">
                            <FaLightbulb />
                            <span>{tutorials[activeTutorial][tutorialStep].action}</span>
                        </div>
                    )}
                    <div className="tutorial-progress">
                        <div className="progress-dots">
                            {tutorials[activeTutorial].map((_, index) => (
                                <span
                                    key={index}
                                    className={`dot ${index === tutorialStep ? 'active' : ''}`}
                                    onClick={() => setTutorialStep(index)}
                                />
                            ))}
                        </div>
                        <div className="tutorial-controls">
                            <button onClick={prevTutorialStep} disabled={tutorialStep === 0}>
                                <FaStepBackward />
                            </button>
                            <button onClick={togglePlay}>
                                {isPlaying ? <FaPause /> : <FaPlay />}
                            </button>
                            <button
                                onClick={nextTutorialStep}
                                disabled={tutorialStep === tutorials[activeTutorial].length - 1}
                            >
                                <FaStepForward />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu principal */}
            <div className="help-content" ref={contentRef}>
                <div className="welcome-card">
                    <MdBusinessCenter className="welcome-icon" />
                    <h2>Bienvenue dans MyBusiness !</h2>
                    <p>
                        Ce guide interactif vous accompagne pas à pas pour maîtriser toutes les fonctionnalités.
                        Chaque section détaille un module et ses astuces pratiques.
                    </p>
                </div>

                {sections.map((section) => (
                    <div
                        key={section.id}
                        id={section.id}
                        className={`help-section ${expandedSection === section.id ? 'expanded' : ''}`}
                    >
                        <div
                            className="section-header"
                            onClick={() => setExpandedSection(
                                expandedSection === section.id ? null : section.id
                            )}
                        >
                            <div className="section-title">
                                <div className="section-icon" style={{ background: section.color }}>
                                    <section.icon />
                                </div>
                                <h3>{section.title}</h3>
                            </div>
                            <div className="section-actions">
                                <button
                                    className="tutorial-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startTutorial(section.id);
                                    }}
                                >
                                    <FaPlay /> Tutoriel
                                </button>
                                <button className="expand-btn">
                                    {expandedSection === section.id ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                            </div>
                        </div>

                        <div className="section-content">
                            <p className="section-description">{section.description}</p>

                            <div className="points-list">
                                {section.points.map((point, index) => (
                                    <div key={index} className="point-item">
                                        <FaCheckCircle style={{ color: section.color }} />
                                        <span>{point}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="tip-box">
                                <FaLightbulb className="tip-icon" />
                                <p>{section.tip}</p>
                            </div>

                            {/* Démonstration interactive */}
                            {expandedSection === section.id && (
                                <div className="demo-preview">
                                    <h4>Aperçu</h4>
                                    <div className="demo-grid">
                                        <div className="demo-card" style={{ borderColor: section.color }}>
                                            <span>📊</span>
                                            <p>Statistiques en temps réel</p>
                                        </div>
                                        <div className="demo-card" style={{ borderColor: section.color }}>
                                            <span>⚡</span>
                                            <p>Actions rapides</p>
                                        </div>
                                        <div className="demo-card" style={{ borderColor: section.color }}>
                                            <span>📱</span>
                                            <p>Interface intuitive</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Section FAQ rapide */}
                <div className="faq-preview">
                    <h3>Questions fréquentes</h3>
                    <div className="faq-grid">
                        <button className="faq-item">
                            <span>Comment ajouter un produit ?</span>
                            <FaChevronRight />
                        </button>
                        <button className="faq-item">
                            <span>Comment créer une facture ?</span>
                            <FaChevronRight />
                        </button>
                        <button className="faq-item">
                            <span>Comment gérer les employés ?</span>
                            <FaChevronRight />
                        </button>
                        <button className="faq-item">
                            <span>Comment consulter les bilans ?</span>
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                <div className="help-footer">
                    <p>MyBusiness v1.0.0 - Tous droits réservés</p>
                    <div className="footer-links">
                        <a href="/conditions">Conditions d'utilisation</a>
                        <a href="/confidentialite">Confidentialité</a>
                        <a href="/contact">Contact</a>
                    </div>
                </div>
            </div>
        </div>
    );
}