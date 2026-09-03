const handleAskCoachForDish = async () => {
    if (!query.trim() || aiLoading) return;

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "dish",
          input: query.trim(),
          remaining: remaining,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nem sikerült elemezni az ételt.");

      setAiResponse(data.reply);

      // Az AI által kalkulált reális levonás azonnali érvényesítése a számlálóban
      if (data.delta) {
        setCustomDelta({
          protein: Math.max(0, data.delta.protein ?? 1),
          veg: Math.max(0, data.delta.veg ?? 1),
          carb: Math.max(0, data.delta.carb ?? 1),
          fat: Math.max(0, data.delta.fat ?? 0),
        });
      }
    } catch (err) {
      setAiError(err.message || "Hiba történt. Kérlek próbáld újra!");
    } finally {
      setAiLoading(false);
    }
  };
