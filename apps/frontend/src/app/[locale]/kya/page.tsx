'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/navigation';
import { InfoIcon } from 'lucide-react';
import { CgFileDocument } from 'react-icons/cg';

export default function KyaPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const [categories1, setCategories1] = useState([]);
    const [questions1, setQuestions1] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const categoriesUrl = `${API_URL}/kya/categories`;
        const questionsUrl = `${API_URL}/kya/questions/fetch`;

        const fetchData = async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to fetch data from ${url}`);
            }
            return res.json();
        };

        Promise.all([fetchData(categoriesUrl), fetchData(questionsUrl)])
            .then(([categoriesData, questionsData]) => {
                setCategories1(categoriesData);
                setQuestions1(questionsData);
            })
            .catch((err) => {
                console.error('Error loading essential data:', err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [API_URL]);

    function transformQuestion(data: any) {
        return {
            id: data.id,
            category_id: data.categoryId,
            question_label: data.questionLabel,
            field_type: data.fieldType,
            tool_tip_available: data.isTooltipAvailable,
            tool_tip_content: data.tooltipText,
            required: data.isMandatory,
            is_dependent: data.isDependent,
            show_refrence_document: data.showReferenceDocument,
            parent_question_id: data.parentQuestionId,
            parent_expected_value: data.kyaOptionId,
            option_details: (data.options || []).map((opt: any) => ({
                option_id: opt.id,
                label: opt.optionLabel,
                approval_ids: opt.serviceMappings?.map((svc: any) => svc.serviceId) || [],
            })),
        };
    }

    const parent_questions = useMemo(() => {
        if (!questions1 || questions1.length === 0) {
            return [];
        }
        return questions1.map((q: any) => transformQuestion(q));
    }, [questions1]);

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="h4 text-secondary">Loading questionnaire...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '120px', paddingBottom: '120px' }}>
            <div className="container">
                <h1 className="h2 fw-bold mb-4">Know Your Approval</h1>
                {categories1.length > 0 ? (
                    <TabsRootOnly categories={categories1} questions={parent_questions} />
                ) : (
                    <div className="alert alert-warning">
                        No categories found.
                    </div>
                )}
            </div>
        </div>
    );
}

const TabsRootOnly = ({ categories, questions }: any) => {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const activeCat = categories[activeIndex] || {};
    const [answers, setAnswers] = useState<Record<number, any>>({});

    const visibleQuestions = useMemo(() => {
        if (!activeCat.id) return [];

        const questionsInCurrentTab = questions.filter((q: any) => q.category_id === activeCat.id);

        const shownQuestions = questionsInCurrentTab.filter((q: any) => {
            if (q.is_dependent === false) {
                return true;
            }

            const parentAns = answers[q.parent_question_id];
            const isConditionMet =
                parentAns !== undefined &&
                parentAns !== '' &&
                parentAns === q.parent_expected_value;

            return isConditionMet;
        });

        return shownQuestions;
    }, [questions, activeCat, answers]);

    const handleSelect = (qId: number, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [qId]: value,
        }));
    };

    const allAnswered = useMemo(() => {
        if (!visibleQuestions.length) return true;

        return visibleQuestions.every((q: any) => {
            if (!q.required) return true;
            return answers[q.id] !== undefined && answers[q.id] !== '';
        });
    }, [visibleQuestions, answers]);

    const handleNext = () => {
        if (!allAnswered) {
            alert('Please answer all required questions before proceeding.');
            return;
        }
        setActiveIndex((i) => i + 1);
    };

    const handleBack = () => {
        setActiveIndex((i) => i - 1);
    };

    const getApprovals = () => {
        const collected = new Set();

        Object.keys(answers).forEach((qid) => {
            const selectedanswer = answers[Number(qid)];
            const answeredQuestion = questions.find((q: any) => q.id === Number(qid));

            if (!answeredQuestion) return;
            if (!answeredQuestion.option_details) return;

            const selectedOption = answeredQuestion.option_details.find(
                (a: any) => a.option_id === selectedanswer
            );

            if (selectedOption && selectedOption.approval_ids) {
                selectedOption.approval_ids.forEach((id: number) => collected.add(id));
            }
        });
        return Array.from(collected);
    };

    const handlesubmit = () => {
        if (!allAnswered) {
            alert('Please answer all required questions before submitting.');
            return;
        }
        const approvalIds = getApprovals();

        console.log(approvalIds);

        const url = `/en/kya/approvals?data=${encodeURIComponent(
            JSON.stringify(approvalIds)
        )}`;

        router.push(url);
    };

    return (
        <div className="w-100">
            {/* Tabs header */}
            <div className="bg-light border rounded-top p-3 mb-3">
                <div className="d-flex flex-wrap gap-3">
                    {categories.map((cat: any, idx: number) => (
                        <button
                            key={cat.id}
                            className={`btn btn-sm fw-medium ${idx === activeIndex
                                ? 'btn-primary text-white'
                                : 'btn-outline-secondary'
                                }`}
                            onClick={() => setActiveIndex(idx)}
                        >
                            {cat.categoryName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visible questions for active tab */}
            <div className="card border shadow-sm rounded-bottom">
                <div className="card-body p-4">
                    {visibleQuestions.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            No questions in this category to display based on your previous choices.
                        </div>
                    ) : (
                        <div className="row g-3">
                            {visibleQuestions.map((q: any) => (
                                <div key={q.id} className="col-12 col-md-6 col-lg-4">
                                    <div className="p-3">
                                        <label className="form-label fw-semibold text-dark small mb-2">
                                            <span>{q.question_label}</span>
                                            {q.required && <span className="text-danger ms-1 fw-bold">*</span>}
                                            {q.tool_tip_available && (
                                                <span
                                                    className="text-primary ms-2"
                                                    title={q.tool_tip_content}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <InfoIcon size={16} />
                                                </span>
                                            )}
                                            {q.show_refrence_document && (
                                                <span
                                                    className="text-primary ms-2"
                                                    title={q.tool_tip_content}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <CgFileDocument size={16} />
                                                </span>
                                            )}
                                        </label>

                                        {q.field_type && q.field_type.trim() === 'Dropdown' ? (
                                            <select
                                                className="form-select border"
                                                value={answers[q.id] ?? ''}
                                                onChange={(e) => {
                                                    const val =
                                                        e.target.value === '' ? '' : Number(e.target.value);
                                                    handleSelect(q.id, val);
                                                }}
                                            >
                                                <option value="">Select</option>
                                                {(q.option_details || []).map((opt: any) => (
                                                    <option key={opt.option_id} value={opt.option_id}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : q.field_type && q.field_type.trim() === 'Text' ? (
                                            <input
                                                type="text"
                                                className="form-control border"
                                                value={answers[q.id] ?? ''}
                                                onChange={(e) => handleSelect(q.id, e.target.value)}
                                            />
                                        ) : (
                                            <div className="text-danger small">
                                                Unsupported field type: {q.field_type}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <div>
                            {activeIndex > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="btn btn-secondary px-4 py-2 fw-semibold"
                                >
                                    Back
                                </button>
                            )}
                        </div>

                        <div>
                            {activeIndex < categories.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className={`btn px-4 py-2 fw-semibold ${allAnswered ? 'btn-success' : 'btn-secondary disabled'
                                        }`}
                                    disabled={!allAnswered}
                                >
                                    Save & next
                                </button>
                            ) : (
                                <button
                                    onClick={handlesubmit}
                                    className={`btn px-4 py-2 fw-semibold ${allAnswered ? 'btn-success' : 'btn-secondary disabled'
                                        }`}
                                    disabled={!allAnswered}
                                >
                                    Submit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
